class PostsController < ApplicationController
  before_action :set_post, only: %i[show update]

  def index
    render json: Post.order(created_at: :desc, id: :desc).map { |post| post_json(post) }
  end

  def show
    render json: post_json(@post)
  end

  def create
    post = Post.new(post_params)

    if post.save
      render json: post_json(post), status: :created
    else
      render_validation_errors(post)
    end
  end

  def update
    if @post.update(post_params)
      render json: post_json(@post)
    else
      render_validation_errors(@post)
    end
  end

  private
    def set_post
      @post = Post.find(params[:id])
    end

    def post_params
      params.expect(post: %i[title body])
    end

    # The response shape must match the Post schema in openapi.yaml.
    def post_json(post)
      post.as_json(only: %i[id title body created_at updated_at])
    end
end
