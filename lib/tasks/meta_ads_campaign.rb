# frozen_string_literal: true
#
# Script de criação de campanha Meta Ads para Orbi.
# Uso: bin/rails runner lib/tasks/meta_ads_campaign.rb
#
# Fluxo:
#   1. Busca conta IG vinculada à Page
#   2. Lista posts do IG (para escolher criativos de post orgânico)
#   3. Faz upload do vídeo
#   4. Cria campanha OUTCOME_TRAFFIC
#   5. Cria AdSet com targeting de personal trainers/profissionais de fitness
#   6. Cria criativo de vídeo + cria Ad
#   7. Opcionalmente, cria Ads de posts orgânicos escolhidos

VIDEO_PATH     = '/home/baby/Downloads/video_orbi_compressed.mp4'
LANDING_URL    = 'https://orbinutri.com.br'
PAGE_ID        = ENV.fetch('META_FB_PAGE_ID')
# Reutiliza vídeo já enviado (evita re-upload). Deixe nil para fazer novo upload.
EXISTING_VIDEO_ID    = '2100345407256778'
EXISTING_CAMPAIGN_ID = '120249143313890764'
EXISTING_ADSET_ID    = '120249143314540764'
EXISTING_CREATIVE_ID = '946576191097537'   # Criativo de vídeo já aprovado
THUMB_PATH           = '/tmp/orbi_thumb.jpg'

client = Meta::MarketingApiClient.new

puts "\n🔍 Buscando conta Instagram vinculada à Página #{PAGE_ID}..."
ig_res = client.get_instagram_account(PAGE_ID)
ig_account_id = nil
posts = []

if ig_res[:success]
  ig_account_id = ig_res.dig(:data, 'instagram_business_account', 'id')
end

if ig_account_id
  puts "✅ Conta Instagram: #{ig_account_id}"

  puts "\n📸 Listando posts do Instagram (@orbi.appfinance)..."
  media_res = client.list_instagram_media(ig_account_id)
  if media_res[:success]
    posts = media_res.dig(:data, 'data') || []
    puts "   #{posts.size} posts encontrados."
    posts.first(5).each_with_index do |p, i|
      caption_short = p['caption'].to_s.gsub(/\s+/, ' ').slice(0, 80)
      puts "   [#{i}] #{p['media_type']} | #{p['timestamp']} | #{caption_short}"
    end
  else
    puts "⚠️  Não foi possível listar posts: #{media_res[:error]}"
  end
else
  puts "⚠️  Conta Instagram não vinculada à Página — anúncios rodarão via Facebook Page como ator."
  puts "    Para vincular: Business Manager → Configurações → Contas Instagram → Adicionar"
end

# ── Upload do vídeo ───────────────────────────────────────────────────────────
if EXISTING_VIDEO_ID
  video_id = EXISTING_VIDEO_ID
  puts "\n🎬 Reutilizando vídeo já enviado. ID: #{video_id}"
else
  puts "\n🎬 Fazendo upload do vídeo (#{(File.size(VIDEO_PATH) / 1024.0 / 1024).round(1)} MB)..."
  video_res = client.upload_video(
    file_path: VIDEO_PATH,
    title:     'Orbi — Gestão para Treinadores'
  )
  abort "❌ Erro no upload do vídeo: #{video_res[:error]}" unless video_res[:success]
  video_id = video_res.dig(:data, 'id')
  puts "✅ Vídeo enviado. ID: #{video_id}"
end

# ── Campanha ──────────────────────────────────────────────────────────────────
if EXISTING_CAMPAIGN_ID
  campaign_id = EXISTING_CAMPAIGN_ID
  puts "\n🚀 Reutilizando campanha existente. ID: #{campaign_id}"
else
  puts "\n🚀 Criando campanha..."
  campaign_res = client.create_campaign(
    name: "Orbi — Captação de Treinadores e Personais [#{Date.today}]"
  )
  abort "❌ Erro ao criar campanha: #{campaign_res[:error]}" unless campaign_res[:success]
  campaign_id = campaign_res.dig(:data, 'id')
  puts "✅ Campanha criada. ID: #{campaign_id} (status: PAUSED)"
end

# ── AdSet — Targeting de profissionais de fitness ─────────────────────────────
# IDs validados via /search?type=adinterest (Graph API v25.0, pt_BR):
# 6003384248805 → Saúde e boa forma (fitness)
# 6003277229371 → Condicionamento físico (fitness)
# 6004115167424 → Exercício físico (fitness)
# 6003420915231 → Academia (fitness)
# 6003945341360 → Treinamento funcional
# 6003269553527 → Esportes (esportes)
#
# Audience: 22-45 anos, Brasil, interesses fitness/esporte, mobile
# daily_budget: R$30,00 = 3000 centavos
puts "\n🎯 Criando AdSet com targeting de personal trainers..."
adset_targeting = {
  geo_locations:        { countries: ['BR'] },
  age_min:              22,
  age_max:              45,
  # 0 = público manual (nossos interesses) | 1 = Advantage+ Audience (IA da Meta)
  targeting_automation: { advantage_audience: 0 },
  flexible_spec:        [
    {
      interests: [
        { id: '6003384248805', name: 'Saúde e boa forma' },
        { id: '6003277229371', name: 'Condicionamento físico' },
        { id: '6004115167424', name: 'Exercício físico' },
        { id: '6003420915231', name: 'Academia' },
        { id: '6003945341360', name: 'Treinamento funcional' }
      ]
    }
  ],
  publisher_platforms:  ['facebook', 'instagram'],
  facebook_positions:   ['feed', 'story'],
  instagram_positions:  ['stream', 'reels', 'story'],
  device_platforms:     ['mobile']
}

if EXISTING_ADSET_ID
  adset_id = EXISTING_ADSET_ID
  puts "✅ Reutilizando AdSet existente. ID: #{adset_id}"
else
  adset_res = client.create_adset(
    name:         'Treinadores BR — Mobile Feed+Reels',
    campaign_id:  campaign_id,
    daily_budget: 3000,
    targeting:    adset_targeting
  )
  abort "❌ Erro ao criar AdSet: #{adset_res[:error]}" unless adset_res[:success]
  adset_id = adset_res.dig(:data, 'id')
  puts "✅ AdSet criado. ID: #{adset_id} | R$30/dia | Feed + Reels"
end

if EXISTING_CREATIVE_ID
  creative_id = EXISTING_CREATIVE_ID
  puts "\n🎨 Reutilizando criativo de vídeo existente. ID: #{creative_id}"
else
  puts "\n🖼️  Fazendo upload da miniatura do vídeo..."
  thumb_res = client.upload_image(file_path: THUMB_PATH)
  abort "❌ Erro no upload da miniatura: #{thumb_res[:error]}" unless thumb_res[:success]
  images_data = thumb_res.dig(:data, 'images')
  image_hash = images_data&.values&.first&.dig('hash')
  abort "❌ Não foi possível extrair image_hash: #{thumb_res}" unless image_hash
  puts "✅ Miniatura enviada. hash: #{image_hash}"

  puts "\n🎨 Criando criativo de vídeo..."
  creative_res = client.create_video_creative(
    name:                'Orbi — Vídeo Treinadores',
    page_id:             PAGE_ID,
    video_id:            video_id,
    message:             'Chega de perder tempo com planilha e WhatsApp. O Orbi organiza seus atletas, seus agendamentos e seu financeiro em um só lugar. 💪',
    link:                LANDING_URL,
    cta_type:            'LEARN_MORE',
    instagram_actor_id:  ig_account_id,
    image_hash:          image_hash
  )
  abort "❌ Erro ao criar criativo de vídeo: #{creative_res[:error]}" unless creative_res[:success]
  creative_id = creative_res.dig(:data, 'id')
  puts "✅ Criativo de vídeo. ID: #{creative_id}"
end

# ── Ad de vídeo ───────────────────────────────────────────────────────────────
puts "\n📢 Criando anúncio de vídeo..."
ad_res = client.create_ad(
  name:        'Orbi Vídeo — Treinadores BR',
  adset_id:    adset_id,
  creative_id: creative_id
)
abort "❌ Erro ao criar anúncio: #{ad_res[:error]}" unless ad_res[:success]

ad_id = ad_res.dig(:data, 'id')
puts "✅ Anúncio criado. ID: #{ad_id}"

# ── Ads de posts orgânicos do IG ──────────────────────────────────────────────
if posts.any?
  puts "\n📌 Criando anúncios de posts orgânicos do Instagram (máx. 3 posts)..."
  posts.first(3).each_with_index do |p, i|
    next unless %w[IMAGE VIDEO CAROUSEL_ALBUM].include?(p['media_type'])

    # object_story_id = "{page_id}_{ig_media_id}"
    story_id = "#{PAGE_ID}_#{p['id']}"

    post_creative_res = client.create_post_creative(
      name:                "Post IG Orgânico ##{i + 1} — #{p['media_type']}",
      object_story_id:     story_id,
      instagram_actor_id:  ig_account_id
    )
    if post_creative_res[:success]
      post_creative_id = post_creative_res.dig(:data, 'id')
      post_ad_res = client.create_ad(
        name:        "Orbi IG Post ##{i + 1}",
        adset_id:    adset_id,
        creative_id: post_creative_id
      )
      if post_ad_res[:success]
        puts "   ✅ Ad de post ##{i + 1} criado. ID: #{post_ad_res.dig(:data, 'id')}"
      else
        puts "   ⚠️  Ad de post ##{i + 1} falhou: #{post_ad_res[:error]}"
      end
    else
      puts "   ⚠️  Criativo de post ##{i + 1} falhou: #{post_creative_res[:error]}"
    end
  end
end

# ── Resumo ────────────────────────────────────────────────────────────────────
puts "\n" + "=" * 60
puts "✅ CAMPANHA CRIADA COM SUCESSO (status: PAUSED)"
puts "=" * 60
puts "  Campanha:  #{campaign_id}"
puts "  AdSet:     #{adset_id}  (R$30/dia | Feed + Reels | BR 22-45)"
puts "  Vídeo AD:  #{ad_id}"
puts "  IG:        @orbi.appfinance (#{ig_account_id})"
puts ""
puts "⚠️  PRÓXIMOS PASSOS:"
puts "  1. Revisar criativos no Gerenciador de Anúncios da Meta"
puts "  2. Ativar a campanha quando aprovar os criativos"
puts "  3. Gerenciador: https://business.facebook.com/adsmanager"
puts "=" * 60
