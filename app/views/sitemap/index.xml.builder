xml.instruct! :xml, version: '1.0', encoding: 'UTF-8'
xml.urlset xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' do

  xml.url do
    xml.loc @base_url + '/'
    xml.changefreq 'weekly'
    xml.priority '1.0'
  end

  xml.url do
    xml.loc @base_url + '/descobrir'
    xml.changefreq 'daily'
    xml.priority '0.9'
  end

  @accounts.each do |account|
    xml.url do
      xml.loc "#{@base_url}/descobrir/#{account.id}"
      xml.lastmod account.updated_at.iso8601
      xml.changefreq 'weekly'
      xml.priority '0.8'
    end
  end

end
