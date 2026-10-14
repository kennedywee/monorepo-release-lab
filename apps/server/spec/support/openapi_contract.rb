# Validates real Rails requests and responses against openapi.yaml.
# A response that drifts from the contract fails the request spec.
module OpenapiContract
  include Committee::Rails::Test::Methods

  def committee_options
    @committee_options ||= {
      schema_path: Rails.root.join("openapi.yaml").to_s,
      strict_reference_validation: true,
      query_hash_key: "rack.request.query_hash",
      parse_response_by_content_type: false
    }
  end
end

RSpec.configure do |config|
  config.include OpenapiContract, type: :request
end
