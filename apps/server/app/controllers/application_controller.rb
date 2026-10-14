class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not found" }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |exception|
    render json: { errors: { exception.param => [ "is missing" ] } }, status: :unprocessable_content
  end

  private
    def render_validation_errors(record)
      render json: { errors: record.errors.to_hash }, status: :unprocessable_content
    end
end
