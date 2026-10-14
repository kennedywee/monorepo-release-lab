# Synthetic "unusual records" for rehearsing the manual data check in RELEASE.md.
# Run only against an isolated rehearsal database, never production:
#
#   DATABASE_PATH=storage/rehearsal.sqlite3 bin/rails db:prepare
#   DATABASE_PATH=storage/rehearsal.sqlite3 bin/rails runner ../../exercises/data-check/unusual_records.rb
#
# The records skip validations on purpose, like rows from an old import script.
if Rails.env.production? || !ENV["DATABASE_PATH"].to_s.include?("rehearsal")
  abort "Refusing to run: use a non-production environment and a DATABASE_PATH containing \"rehearsal\"."
end

now = Time.current
blank_title = Post.insert_all!([ { title: "   ", body: "Imported in 2019 without a title.", created_at: now, updated_at: now } ]).rows.flatten.first
long_title = Post.insert_all!([ { title: "Imported headline " * 15, body: "Imported in 2019.", created_at: now, updated_at: now } ]).rows.flatten.first
Comment.insert_all!([
  { post_id: blank_title, body: " ", created_at: now, updated_at: now },
  { post_id: long_title, body: "", created_at: now, updated_at: now }
])

puts "Added synthetic unusual records: posts #{blank_title} (blank title) and #{long_title} (#{Post.find(long_title).title.length}-character title), 2 blank comments."
