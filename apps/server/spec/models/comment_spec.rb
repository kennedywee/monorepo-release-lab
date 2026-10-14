require "rails_helper"

RSpec.describe Comment do
  let(:post_record) { Post.create!(title: "Title", body: "Body") }

  it "requires a body" do
    expect(post_record.comments.build(body: "")).not_to be_valid
  end

  it "limits the body to 2000 characters" do
    expect(post_record.comments.build(body: "x" * 2001)).not_to be_valid
  end

  it "belongs to a post" do
    expect(Comment.new(body: "Orphan")).not_to be_valid
  end
end
