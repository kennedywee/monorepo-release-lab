# Browser apps (web, store, desktop) call this API from other origins.
# CORS_ORIGINS is a comma-separated list, for example
# "https://staff.example.com,https://blog.example.com". The default "*" suits local work.
# The API uses no cookies or credentials, so a wildcard does not expose a session.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS", "*").split(",").map(&:strip))

    resource "*",
      headers: :any,
      methods: %i[get post patch options head]
  end
end
