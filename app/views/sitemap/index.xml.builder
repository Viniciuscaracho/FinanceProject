xml.instruct! :xml, version: '1.0', encoding: 'UTF-8'
xml.urlset xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' do
  today = Date.today.iso8601
  base  = 'https://orbinutri.com.br'

  # ── Páginas estáticas ───────────────────────────────────────────────────
  [
    ['/',                                'weekly',  '1.0'],
    ['/nutricionistas',                  'daily',   '0.9'],
    ['/nutricionistas/perto-de-mim',     'weekly',  '0.8'],
    ['/descobrir',                       'daily',   '0.8'],
    ['/politica-de-privacidade',         'yearly',  '0.3'],
    ['/termos-de-uso',                   'yearly',  '0.3'],
  ].each do |path, freq, priority|
    xml.url do
      xml.loc        "#{base}#{path}"
      xml.lastmod    today
      xml.changefreq freq
      xml.priority   priority
    end
  end

  # ── /nutricionistas/especialidade/:spec ─────────────────────────────────
  @specialties.each do |spec|
    xml.url do
      xml.loc        "#{base}/nutricionistas/especialidade/#{spec}"
      xml.lastmod    today
      xml.changefreq 'weekly'
      xml.priority   '0.8'
    end
  end

  # ── /nutricionistas/:cidade ──────────────────────────────────────────────
  @cities.each do |city|
    xml.url do
      xml.loc        "#{base}/nutricionistas/#{city[:slug]}"
      xml.lastmod    today
      xml.changefreq 'weekly'
      xml.priority   '0.8'
    end

    # ── /nutricionistas/:cidade/:spec (ouro para SEO) ─────────────────────
    @specialties.each do |spec|
      xml.url do
        xml.loc        "#{base}/nutricionistas/#{city[:slug]}/#{spec}"
        xml.lastmod    today
        xml.changefreq 'weekly'
        xml.priority   '0.9'
      end
    end
  end

  # ── /nutricionistas/sao-paulo/:bairro ───────────────────────────────────
  @neighborhoods.each do |bairro|
    xml.url do
      xml.loc        "#{base}/nutricionistas/sao-paulo/#{bairro}"
      xml.lastmod    today
      xml.changefreq 'weekly'
      xml.priority   '0.7'
    end
  end

  # ── /nutricionista/:slug (perfis individuais) ────────────────────────────
  @profiles.each do |p|
    xml.url do
      xml.loc        "#{base}/nutricionista/#{p[:slug]}"
      xml.lastmod    p[:updated_at].iso8601
      xml.changefreq 'monthly'
      xml.priority   '0.7'
    end
  end
end
