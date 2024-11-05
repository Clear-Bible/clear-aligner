#!/bin/env python3
import argparse
import csv
import math
import os
import sqlite3
import regex as re

prefixed_bcvwp = re.compile(r"^[onON]\d")
gloss_needing_cleanup = re.compile(r'^(.+\..+)+$')
whitespace_only = re.compile(r'^[\p{P}\s]*$', re.U)


def sanitize_bcvwp(bcv_id):
    result = bcv_id.strip()
    if prefixed_bcvwp.match(result):
        result = result[1:]
    return result

def sanitize_exclude(input_exclude):
    #trim and lower case
    working_exclude = input_exclude.strip().lower()
    if len(working_exclude) < 1:
        return 0
    first_letter = working_exclude[0]
    if first_letter == 'n' or first_letter == 'f':
        return 0
    return 1

def parse_bcvwp(bcv_id):
    sanitized = sanitize_bcvwp(bcv_id)
    book = sanitized[0:2]
    chapter = sanitized[2:5]
    verse = sanitized[5:8]
    word = sanitized[8:11]
    part = sanitized[11:12]
    return {
        'book': int(book) if book is not None else None,
        'chapter': int(chapter) if chapter is not None else None,
        'verse': int(verse) if verse is not None else None,
        'word': int(word) if word is not None else None,
        'part': int(part) if len(part) > 0 else None
    }


def val(value):
    if value is None or type(value) == str and value.strip() == '':
        return 'NULL'
    return f'"{value}"'


def insert_language(project_conn, project_cursor, language):
    existing = project_cursor.execute(f'SELECT code FROM language WHERE code = "{language.get("code")}"').fetchone()
    if existing is not None:
        return
    project_cursor.execute(
        f'INSERT INTO language (code, text_direction, font_family) VALUES ({val(language.get("code"))}, {val(language.get("textDirection"))}, {val(language.get("fontFamily"))})')
    project_conn.commit()


def insert_corpus(project_conn, project_cursor, corpus):
    insert_language(project_conn, project_cursor, corpus['language'])
    project_cursor.execute(
        f'INSERT INTO corpora (id, side, name, full_name, file_name, language_id) VALUES ({val(corpus.get("id"))}, {val(corpus.get("side"))}, {val(corpus.get("name"))}, {val(corpus.get("fullName"))}, {val(corpus.get("fileName"))}, {val(corpus.get("language").get("code"))})')
    project_conn.commit()


def insert_word_or_part(project_conn, project_cursor, corpus_id, language_id, word):
    project_cursor.execute(
        f'INSERT INTO words_or_parts (id, corpus_id, side, text, after, gloss, position_book, position_chapter, position_verse, position_word, position_part, normalized_text, source_verse_bcvid, language_id, exclude) VALUES ({val(word.get("id"))}, {val(corpus_id)}, {val(word.get("side"))}, {val(word.get("text"))}, {val(word.get("after"))}, {val(word.get("gloss"))}, {val(word.get("position_book"))}, {val(word.get("position_chapter"))}, {val(word.get("position_verse"))}, {val(word.get("position_word"))}, {val(word.get("position_part"))}, {val(word.get("normalized_text"))}, {val(word.get("source_verse_bcvid"))}, {val(language_id)}, {val(word.get("exclude"))})')


def cleanup_gloss(gloss):
    if gloss is None:
        return None
    if gloss_needing_cleanup.match(gloss):
        return gloss.replace('.', ' ')
    return gloss


def read_corpus(project_conn, project_cursor, metadata, tsv_file, id_field):
    insert_corpus(project_conn, project_cursor, metadata)
    corpus_id = metadata.get('id')
    corpus_side = metadata.get('side')
    language_id = metadata.get('language').get('code')
    with open(tsv_file) as tsvFd:
        total_rows = len(tsvFd.readlines())
    with open(tsv_file) as tsvFd:
        corpus = csv.reader(tsvFd, delimiter='\t', quotechar='"')
        header = next(corpus)
        idx_id = header.index(id_field if id_field else 'xml:id')
        idx_text = header.index('text')
        idx_lemma = header.index('lemma') if 'lemma' in header else header.index('text')
        idx_after = header.index('after') if 'after' in header else -1
        idx_gloss = header.index('gloss') if 'gloss' in header else -1
        idx_english = header.index('english') if 'english' in header else -1
        idx_source_verse = header.index('source_verse') if 'source_verse' in header else -1
        idx_exclude = header.index('exclude') if 'exclude' in header else -1
        idx = 0
        last_percentage = -1
        for row in corpus:
            row_id = sanitize_bcvwp(row[idx_id])
            text = row[idx_text] or row[idx_lemma]
            if corpus_side == 'targets' and (text is None or whitespace_only.match(text)):
                continue
            after = row[idx_after] if idx_after >= 0 else ""
            gloss = cleanup_gloss(row[idx_gloss] or row[idx_english]) if idx_gloss >= 0 or idx_english >= 0 else ""
            bcvwp = parse_bcvwp(row[idx_id])
            source_verse = sanitize_bcvwp(row[idx_source_verse]) if idx_source_verse >= 0 else ""
            exclude = sanitize_exclude(row[idx_exclude]) if idx_exclude >= 0 else "0"
            insert_word_or_part(project_conn, project_cursor, corpus_id, language_id, {
                'id': f'{metadata.get("side")}:{row_id}',
                'corpus_id': corpus_id,
                'side': corpus_side,
                'text': text,
                'after': after,
                'gloss': gloss,
                'position_book': bcvwp.get('book'),
                'position_chapter': bcvwp.get('chapter'),
                'position_verse': bcvwp.get('verse'),
                'position_word': bcvwp.get('word'),
                'position_part': bcvwp.get('part'),
                'normalized_text': text.lower(),
                'source_verse_bcvid': source_verse,
                'exclude': exclude,
            })
            current_percentage = math.floor((idx / total_rows) * 100)
            if idx % 1000 == 0:
                project_conn.commit()
            if current_percentage != last_percentage:
                last_percentage = current_percentage
                print(f'{metadata.get("id")}: {last_percentage}%')
            idx += 1
    project_conn.commit()


def parse_args():
    parser = argparse.ArgumentParser(description='Create empty Clear Aligner databases.')
    parser.add_argument('-of', '--output-filename', nargs=1)
    parser.add_argument('-sf', '--sql-file', required=False, nargs='*')
    parser.add_argument('-cf', '--corpus-file', required=False, nargs=1)
    parser.add_argument('-ci', '--corpus-id', required=False, nargs=1)
    parser.add_argument('-cn', '--corpus-name', required=False, nargs=1)
    parser.add_argument('-cfn', '--corpus-full-name', required=False, nargs=1)
    parser.add_argument('-cs', '--corpus-side', required=False, nargs=1, choices=['sources', 'targets'])
    parser.add_argument('-cl', '--corpus-language', required=False, nargs=1)
    parser.add_argument('-ctd', '--corpus-text-direction', required=False, nargs=1, choices=['ltr', 'rtl'])
    parser.add_argument('-cff', '--corpus-font-family', required=False, nargs=1)
    parser.add_argument('-cif', '--corpus-id-field', required=False, nargs=1)
    result = parser.parse_args()

    if result.corpus_file \
            and (not result.corpus_id
                 or not result.corpus_name
                 or not result.corpus_full_name
                 or not result.corpus_side
                 or not result.corpus_language
                 or not result.corpus_text_direction
                 or not result.corpus_font_family):
        raise RuntimeError('Missing corpus arguments (run with "-h" for complete list)')

    if not result.sql_file \
            and not result.corpus_file:
        raise RuntimeError('Missing SQl script and corpus arguments (nothing to do; run with "-h" for complete list)')

    return result


def main():
    inputs = parse_args()

    # create project db connection
    with sqlite3.connect(inputs.output_filename[0]) as project_conn:
        project_cursor = project_conn.cursor()

        # read project schema script
        if inputs.sql_file:
            for sql_file in inputs.sql_file:
                with open(sql_file, 'r') as sql_file_fd:
                    for command in sql_file_fd.read().split(';'):
                        project_cursor.execute(command)

        # with open('create-template-db.sql', 'r') as projectSchemaFd:

        if inputs.corpus_file:
            read_corpus(project_conn, project_cursor, {
                'id': inputs.corpus_id[0],
                'name': inputs.corpus_name[0],
                'fullName': inputs.corpus_full_name[0],
                'side': inputs.corpus_side[0],
                'fileName': os.path.basename(inputs.corpus_file[0]),
                'language': {
                    'code': inputs.corpus_language[0],
                    'textDirection': inputs.corpus_text_direction[0],
                    'fontFamily': inputs.corpus_font_family[0]
                }
            }, inputs.corpus_file[0],
                        inputs.corpus_id_field[0] \
                            if inputs.corpus_id_field \
                            else None)


if __name__ == '__main__':
    main()
