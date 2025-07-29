# frozen_string_literal: true

direct :cdn do |model, options|
  expires_in = options.delete(:expires_in) { ActiveStorage.urls_expire_in }

  if model.respond_to?(:signed_id)
    route_for(
      :rails_service_blob_proxy,
      model.signed_id(expires_in:),
      model.filename,
      options.merge(host: ENV.fetch('CLOUDFRONT_ENDPOINT', 'localhost'))
    )
  else
    signed_blob_id = model.blob.signed_id(expires_in:)
    variation_key = model.variation.key
    filename = model.blob.filename

    route_for(
      :rails_blob_representation_proxy,
      signed_blob_id,
      variation_key,
      filename,
      options.merge(host: ENV.fetch('CLOUDFRONT_ENDPOINT', 'localhost'))
    )
  end
end