require "rails_helper"

RSpec.describe Post do
  it "requires a title and a body" do
    post = Post.new

    expect(post).not_to be_valid
    expect(post.errors.attribute_names).to contain_exactly(:title, :body)
  end

  it "limits the title to 200 characters" do
    expect(Post.new(title: "x" * 201, body: "Body")).not_to be_valid
  end

  it "deletes its comments with it" do
    post = Post.create!(title: "Title", body: "Body")
    post.comments.create!(body: "Comment")

    expect { post.destroy }.to change(Comment, :count).by(-1)
  end
end
