require "rails_helper"

RSpec.describe "Comments API", type: :request do
  let!(:post_record) { Post.create!(title: "A post", body: "Body") }

  describe "GET /posts/:post_id/comments" do
    it "lists comments oldest first" do
      post_record.comments.create!(body: "Second", created_at: 1.hour.ago)
      post_record.comments.create!(body: "First", created_at: 2.hours.ago)

      get "/posts/#{post_record.id}/comments"

      assert_schema_conform(200)
      expect(response.parsed_body.map { |comment| comment["body"] }).to eq([ "First", "Second" ])
    end

    it "returns 404 for a missing post" do
      get "/posts/0/comments"

      assert_schema_conform(404)
    end
  end

  describe "POST /posts/:post_id/comments" do
    it "creates a comment" do
      expect {
        post "/posts/#{post_record.id}/comments", params: { body: "Great post" }, as: :json
      }.to change(post_record.comments, :count).by(1)

      assert_schema_conform(201)
      expect(response.parsed_body).to include("post_id" => post_record.id, "body" => "Great post")
    end

    it "rejects a blank comment" do
      post "/posts/#{post_record.id}/comments", params: { body: "   " }, as: :json

      assert_schema_conform(422)
      expect(response.parsed_body["errors"]).to eq("body" => [ "can't be blank" ])
    end

    it "returns 404 for a missing post" do
      post "/posts/0/comments", params: { body: "Hello" }, as: :json

      assert_schema_conform(404)
    end
  end
end
