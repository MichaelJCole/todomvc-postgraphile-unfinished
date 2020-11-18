-- Enter migration here
create table post (
  id serial primary key,
  headline text,
  body text
);
create table author (
  id serial primary key,
  name text
);
create table post_author (
  post_id integer references post,
  author_id integer references author,
  primary key (post_id, author_id)
);

create function "post_authorsByPostId"(p post)
returns setof author as $$
  select author.*
  from author
  inner join post_author
  on (post_author.author_id = author.id)
  where post_author.post_id = p.id;
$$ language sql stable;