PRAGMA foreign_keys= OFF;
BEGIN TRANSACTION;
CREATE TABLE language
(
    code           TEXT
        constraint id
            primary key,
    text_direction TEXT,
    font_family    TEXT
);
CREATE TABLE IF NOT EXISTS "corpora"
(
    id             TEXT
        constraint id
            primary key,
    side           TEXT not null,
    name           TEXT not null,
    full_name      TEXT not null,
    file_name      TEXT not null,
    language_id    TEXT not null
);
CREATE TABLE links
(
    id           TEXT not null
        constraint links_pk
            primary key on conflict ignore,
    sources_text TEXT,
    targets_text TEXT
);
CREATE TABLE IF NOT EXISTS "words_or_parts"
(
    id                 TEXT
        constraint words_or_parts__pk
            primary key,
    corpus_id          TEXT    not null,
    language_id        TEXT    not null,
    side               TEXT    not null,
    text               TEXT    not null,
    after              TEXT,
    gloss              TEXT,
    position_book      integer not null,
    position_chapter   integer not null,
    position_verse     integer not null,
    position_word      integer not null,
    position_part      integer,
    normalized_text    TEXT    not null,
    lemma              TEXT,
    source_verse_bcvid TEXT,
    exclude            integer,
    required           integer
);
CREATE TABLE IF NOT EXISTS "links__target_words"
(
    link_id TEXT not null,
    word_id TEXT not null,
    constraint links__words_pk
        primary key (link_id, word_id) on conflict ignore
);
CREATE TABLE IF NOT EXISTS "links__source_words"
(
    link_id TEXT not null,
    word_id TEXT not null,
    constraint links__source_words_pk
        primary key (link_id, word_id) on conflict ignore
);
CREATE INDEX idx__word_or_part__position_book
    on words_or_parts (position_book);
CREATE INDEX idx__word_or_part__position_chapter
    on words_or_parts (position_chapter);
CREATE INDEX idx__word_or_part__position_verse
    on words_or_parts (position_verse);
CREATE INDEX idx__word_or_part__position_word
    on words_or_parts (position_word);
CREATE INDEX idx__word_or_part__position_part
    on words_or_parts (position_part);


CREATE INDEX idx__word_or_part__text
    on words_or_parts (corpus_id, text);
CREATE INDEX links_sources_text_index
    on links (sources_text);
CREATE INDEX links_targets_text_index
    on links (targets_text);
CREATE INDEX words_or_parts_after_index
    on words_or_parts (after);
CREATE INDEX words_or_parts_normalized_text_index
    on words_or_parts (normalized_text);
CREATE INDEX words_or_parts_lemma_index
    on words_or_parts (lemma);
CREATE INDEX words_or_parts_text_index
    on words_or_parts (text);
CREATE INDEX idx__word_or_part_side_index
    on words_or_parts (side);

create index links__source_words_word_id_index
    on links__source_words (word_id);
create index links__source_words_link_id_index
    on links__source_words (link_id);
create index links__target_words_word_id_index
    on links__target_words (word_id);
create index links__target_words_link_id_index
    on links__target_words (link_id);

COMMIT;
