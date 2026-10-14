class CommentsController < ApplicationController
  before_action :set_post

  def index
    render json: @post.comments.order(:created_at, :id).map { |comment| comment_json(comment) }
  end

  def create
    comment = @post.comments.build(comment_params)

    if comment.save
      render json: comment_json(comment), status: :created
    else
      render_validation_errors(comment)
    end
  end

  private
    def set_post
      @post = Post.find(params[:post_id])
    end

    def comment_params
      params.expect(comment: %i[body])
    end

    # The response shape must match the Comment schema in openapi.yaml.
    def comment_json(comment)
      comment.as_json(only: %i[id post_id body created_at updated_at])
    end
end
