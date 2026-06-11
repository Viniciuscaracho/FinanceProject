xml.instruct! :xml, version: '1.0', encoding: 'UTF-8'
xml.urlset xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' do
  today = Date.today.iso8601

  [
    ['/',                          'weekly',  '1.0'],
    ['/descobrir',                 'daily',   '0.9'],
    ['/landing-nutri',             'monthly', '0.8'],
    ['/politica-de-privacidade',   'yearly',  '0.3'],
    ['/termos-de-uso',             'yearly',  '0.3'],
  ].each do |path, freq, priority|
    xml.url do
      xml.loc "https://orbinutri.com.br#{path}"
      xml.lastmod today
      xml.changefreq freq
      xml.priority priority
    end
  end

  %w[emagrecimento esportiva clinica vegana diabetes hipertensao gestante
     pediatrica comportamental funcional oncologica renal].each do |specialty|
    xml.url do
      xml.loc "https://orbinutri.com.br/descobrir?especialidade=#{specialty}"
      xml.lastmod today
      xml.changefreq 'weekly'
      xml.priority '0.7'
    end
  end

  @accounts.find_each do |account|
    xml.url do
      xml.loc "https://orbinutri.com.br/descobrir/#{account.id}"
      xml.lastmod account.updated_at.iso8601
      xml.changefreq 'weekly'
      xml.priority '0.8'
    end
  end
end
