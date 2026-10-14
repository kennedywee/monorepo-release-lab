require "rails_helper"

# Each example checks API behavior and calls assert_schema_conform, which
# validates the actual request and response against openapi.yaml.
RSpec.describe "Posts API", type: :request do
  let!(:older) { Post.create!(title: "Older", body: "First body", created_at: 2.days.ago) }
  let!(:newer) { Post.create!(title: "Newer", body: "Second body", created_at: 1.day.ago) }

  describe "GET /posts" do
    it "lists posts newest first" do
      get "/posts"

      assert_schema_conform(200)
      expect(response.parsed_body.map { |post| post["title"] }).to eq([ "Newer", "Older" ])
    end
  end

  describe "GET /posts/:id" do
    it "shows a post" do
      get "/posts/#{older.id}"

      assert_schema_conform(200)
      expect(response.parsed_body).to include("id" => older.id, "title" => "Older", "body" => "First body")
    end

    it "returns 404 for a missing post" do
      get "/posts/0"

      assert_schema_conform(404)
      expect(response.parsed_body).to eq("error" => "Not found")
    end
  end

  describe "POST /posts" do
    it "creates a post" do
      expect {
        post "/posts", params: { title: "Hello", body: "World" }, as: :json
      }.to change(Post, :count).by(1)

      assert_schema_conform(201)
      expect(response.parsed_body).to include("title" => "Hello", "body" => "World")
    end

    it "rejects a blank title" do
      expect {
        post "/posts", params: { title: "", body: "World" }, as: :json
      }.not_to change(Post, :count)

      assert_schema_conform(422)
      expect(response.parsed_body["errors"]).to eq("title" => [ "can't be blank" ])
    end
  end

  describe "PATCH /posts/:id" do
    it "updates a post" do
      patch "/posts/#{older.id}", params: { title: "Edited", body: "Edited body" }, as: :json

      assert_schema_conform(200)
      expect(older.reload).to have_attributes(title: "Edited", body: "Edited body")
    end

    it "rejects a title longer than 200 characters" do
      patch "/posts/#{older.id}", params: { title: "x" * 201, body: "Body" }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      assert_response_schema_confirm(422)
      expect(older.reload.title).to eq("Older")
    end

    it "returns 404 for a missing post" do
      patch "/posts/0", params: { title: "Edited", body: "Body" }, as: :json

      assert_schema_conform(404)
    end
  end
end
