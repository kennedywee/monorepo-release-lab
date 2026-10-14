Rails.application.routes.draw do
  # Health check for load balancers and smoke tests. Not part of the OpenAPI contract.
  get "up" => "rails/health#show", as: :rails_health_check

  # Every route below is described in openapi.yaml.
  resources :posts, only: %i[index show create update] do
    resources :comments, only: %i[index create]
  end
end
