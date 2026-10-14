# Hypothetical v1.1.0 schema migration used by the data-check runbook in RELEASE.md.
# It is not in apps/server/db/migrate on main. Copy it there only for a rehearsal.
#
# The database will refuse to add these constraints while any row breaks them,
# so the unusual records must be inspected and repaired before deployment.
# The repair itself is never part of this migration.
class AddTitleAndBodyChecks < ActiveRecord::Migration[8.1]
  def change
    add_check_constraint :posts, "length(trim(title)) > 0 AND length(title) <= 200", name: "posts_title_present_and_short"
    add_check_constraint :comments, "length(trim(body)) > 0", name: "comments_body_present"
  end
end
