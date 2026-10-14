# Approved data repair for v1.1.0. This is not a migration.
# Run it in `bin/rails console` only after inspect.rb reports "REPAIR NEEDED" and
# nothing blocking. It prints every change so the output can go in the release record.
Post.transaction do
  Post.where("trim(title) = ''").find_each do |post|
    puts "post #{post.id}: title #{post.title.inspect} -> \"Untitled post ##{post.id}\""
    post.update!(title: "Untitled post ##{post.id}")
  end

  Comment.where("trim(body) = ''").find_each do |comment|
    puts "comment #{comment.id} on post #{comment.post_id}: deleted (body was #{comment.body.inspect})"
    comment.destroy!
  end
end
