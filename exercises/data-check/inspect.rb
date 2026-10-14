# Read-only inspection for the v1.1.0 data check. Paste into `bin/rails console`,
# or run with `bin/rails runner`. It changes nothing.
findings = {
  blank_titles: Post.where("trim(title) = ''").ids,
  long_titles: Post.where("length(title) > 200").pluck(:id, Arel.sql("length(title)")),
  blank_comments: Comment.where("trim(body) = ''").pluck(:id, :post_id),
  orphan_comments: Comment.where.missing(:post).ids
}
pp findings

blocking = []
blocking << "orphan comments exist" if findings[:orphan_comments].any?
blocking << "titles over 200 characters need an editor" if findings[:long_titles].any?
blocking << "more than 10 blank titles: investigate the import" if findings[:blank_titles].size > 10
repairable = findings[:blank_titles].any? || findings[:blank_comments].any?

puts(if blocking.any? then "BLOCKED: #{blocking.join('; ')}"
     elsif repairable then "REPAIR NEEDED: run the approved repair, then inspect again"
     else "READY: no unusual records" end)
