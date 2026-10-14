# Synthetic seed data. Safe to run more than once.
posts = [
  {
    title: "Welcome to the release lab",
    body: "This blog exists to show how one Git tag coordinates several apps that share one API.",
    comments: [ "Nice to see everything in one repository.", "Does the mobile app read this too?" ]
  },
  {
    title: "How a release candidate works",
    body: "We tag a commit as v1.1.0-rc.1, test it with its own database, and promote it only when it is ready.",
    comments: [ "So the stable tag points at the same commit as the candidate?" ]
  },
  {
    title: "Why old mobile apps matter",
    body: "Installed apps keep calling the API long after we ship a new version. The API must stay compatible.",
    comments: []
  }
]

posts.each do |attributes|
  post = Post.find_or_create_by!(title: attributes[:title]) { |p| p.body = attributes[:body] }
  attributes[:comments].each { |body| post.comments.find_or_create_by!(body: body) }
end

puts "Seeded #{Post.count} posts and #{Comment.count} comments."
