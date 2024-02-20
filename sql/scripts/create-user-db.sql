BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "preference"
(
    id              TEXT
        constraint id
            primary key,
    bcv             TEXT not null,
    alignment_view  TEXT not null,
    page            TEXT not null,
    current_project TEXT not null,
    show_gloss      integer not null
);
COMMIT;
