# frozen_string_literal: true
#
# Nutricionistas de demonstração com endereços completos, coordenadas reais e fotos
# Execute: bundle exec rails runner db/seeds/nutri_discover.rb

require 'open-uri'

# Bypass email deliverability check (Mailgun) for demo seeds — domain is fake by design
User.class_eval    { def verify_email_address; end }
Company.class_eval { def verify_email_address; end }

NUTRIS = [
  {
    first_name: 'Fernanda', last_name: 'Costa',
    email: 'fernanda.costa.nutri@discover-demo.orbi',
    business_name: 'Fernanda Costa Nutrição',
    ratings_count: 128, ratings_average: 4.9, patients_count: 520,
    phone: '(11) 98231-4057',
    professional_registration: 'CRN-3 54821/P',
    description: 'Nutricionista funcional com 10 anos de experiência. Especialista em emagrecimento, modulação intestinal e nutrição esportiva. Atendimento presencial e online.',
    specialties: ['emagrecimento', 'esportiva'],
    instagram_url: 'https://instagram.com/fernandacostanutri',
    photo_gender: 'women', photo_index: 1,
    address: { line1: 'Rua dos Pinheiros, 498', district: 'Pinheiros', city: 'São Paulo', state: 'SP', postcode: '05422-001', lat: -23.5632, lng: -46.6833 },
    services: [
      { name: 'Consulta Nutricional',     price: 220_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Alimentar Completo', price: 480_00, duration: 90, modality: 'presencial' },
      { name: 'Retorno / Acompanhamento', price: 130_00, duration: 45, modality: 'online' },
      { name: 'Consulta Online',          price: 190_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Juliana', last_name: 'Rocha',
    email: 'juliana.rocha.nutri@discover-demo.orbi',
    business_name: 'Dra. Juliana Rocha',
    ratings_count: 94, ratings_average: 4.8, patients_count: 380,
    phone: '(11) 97043-8812',
    professional_registration: 'CRN-3 48392/P',
    description: 'Especialista em nutrição materno-infantil, gestação e aleitamento. Também atua com saúde feminina e síndrome do ovário policístico. Atendimento humanizado e baseado em evidências.',
    specialties: ['gestação', 'saúde feminina', 'infantil'],
    instagram_url: 'https://instagram.com/drjulianarocha',
    photo_gender: 'women', photo_index: 2,
    address: { line1: 'Alameda Santos, 715', district: 'Jardim Paulista', city: 'São Paulo', state: 'SP', postcode: '01419-001', lat: -23.5630, lng: -46.6542 },
    services: [
      { name: 'Consulta Nutricional Feminina', price: 250_00, duration: 60, modality: 'presencial' },
      { name: 'Nutrição na Gestação',          price: 280_00, duration: 60, modality: 'presencial' },
      { name: 'Retorno Mensal',                price: 150_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Rodrigo', last_name: 'Andrade',
    email: 'rodrigo.andrade.nutri@discover-demo.orbi',
    business_name: 'Rodrigo Andrade Performance',
    ratings_count: 61, ratings_average: 4.7, patients_count: 245,
    phone: '(11) 99187-6234',
    professional_registration: 'CRN-3 61047/P',
    description: 'Nutricionista esportivo para atletas e praticantes de atividade física. Foco em ganho de massa, performance e suplementação inteligente. Parceiro de academias e equipes de crossfit.',
    specialties: ['esportiva', 'emagrecimento'],
    instagram_url: 'https://instagram.com/rodrigoandradenutrição',
    photo_gender: 'men', photo_index: 1,
    address: { line1: 'Av. Ibirapuera, 2033', district: 'Moema', city: 'São Paulo', state: 'SP', postcode: '04029-901', lat: -23.6004, lng: -46.6634 },
    services: [
      { name: 'Avaliação Nutricional Esportiva', price: 300_00, duration: 75, modality: 'presencial' },
      { name: 'Plano de Performance',            price: 550_00, duration: 90, modality: 'presencial' },
      { name: 'Consultoria de Suplementação',    price: 180_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Camila', last_name: 'Ferreira',
    email: 'camila.ferreira.nutri@discover-demo.orbi',
    business_name: 'Camila Ferreira Nutrição Clínica',
    ratings_count: 143, ratings_average: 4.9, patients_count: 615,
    phone: '(11) 96754-2190',
    professional_registration: 'CRN-3 39518/P',
    description: 'Nutrição clínica com abordagem integrativa. Especialista em doenças crônicas, diabetes, hipertensão e saúde digestiva. Atendimento acolhedor, individualizado e baseado em exames laboratoriais.',
    specialties: ['emagrecimento', 'vegetariana'],
    instagram_url: nil,
    photo_gender: 'women', photo_index: 3,
    address: { line1: 'Rua Abílio Soares, 532', district: 'Paraíso', city: 'São Paulo', state: 'SP', postcode: '04005-002', lat: -23.5783, lng: -46.6417 },
    services: [
      { name: 'Consulta Clínica',            price: 200_00, duration: 60, modality: 'presencial' },
      { name: 'Plano para Doenças Crônicas', price: 420_00, duration: 90, modality: 'presencial' },
      { name: 'Orientação Nutricional',      price: 160_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Beatriz', last_name: 'Martins',
    email: 'beatriz.martins.nutri@discover-demo.orbi',
    business_name: 'Bea Martins — Plant-Based',
    ratings_count: 52, ratings_average: 4.8, patients_count: 190,
    phone: '(11) 94822-7603',
    professional_registration: 'CRN-3 57290/P',
    description: 'Nutricionista vegana e vegetariana. Ajudo pessoas a fazerem a transição alimentar de forma segura, sem carências nutricionais e com muito sabor. Cardápios criativos e deliciosos.',
    specialties: ['vegetariana', 'emagrecimento'],
    instagram_url: 'https://instagram.com/beamartinsnutri',
    photo_gender: 'women', photo_index: 4,
    address: { line1: 'Rua Pamplona, 1218', district: 'Jardim Paulista', city: 'São Paulo', state: 'SP', postcode: '01405-100', lat: -23.5660, lng: -46.6522 },
    services: [
      { name: 'Consulta Vegetariana/Vegana', price: 210_00, duration: 60, modality: 'presencial' },
      { name: 'Cardápio Plant-Based',        price: 390_00, duration: 75, modality: 'online' },
      { name: 'Retorno Quinzenal',           price: 120_00, duration: 30, modality: 'online' },
    ]
  },
  {
    first_name: 'Lucas', last_name: 'Oliveira',
    email: 'lucas.oliveira.nutri@discover-demo.orbi',
    business_name: 'Dr. Lucas Oliveira',
    ratings_count: 38, ratings_average: 4.6, patients_count: 165,
    phone: '(11) 98365-0471',
    professional_registration: 'CRN-3 44703/P',
    description: 'Nutricionista com pós-graduação em nutrição oncológica e imunologia. Atendo pacientes em tratamento de câncer, pós-operatório e imunocomprometidos com foco em qualidade de vida.',
    specialties: ['emagrecimento'],
    instagram_url: nil,
    photo_gender: 'men', photo_index: 2,
    address: { line1: 'Av. Angélica, 1517', district: 'Higienópolis', city: 'São Paulo', state: 'SP', postcode: '01227-200', lat: -23.5457, lng: -46.6612 },
    services: [
      { name: 'Consulta Nutricional',      price: 240_00, duration: 60, modality: 'presencial' },
      { name: 'Acompanhamento Oncológico', price: 300_00, duration: 60, modality: 'presencial' },
      { name: 'Teleconsulta',              price: 200_00, duration: 50, modality: 'online' },
    ]
  },
  {
    first_name: 'Patricia', last_name: 'Lima',
    email: 'patricia.lima.nutri@discover-demo.orbi',
    business_name: 'Patricia Lima Emagrecimento',
    ratings_count: 212, ratings_average: 4.9, patients_count: 870,
    phone: '(11) 97198-3045',
    professional_registration: 'CRN-3 62815/P',
    description: 'Nutricionista comportamental e coach de emagrecimento. Trabalho com a relação emocional com a comida para resultados duradouros. Método exclusivo RealFood com mais de 500 pacientes atendidos.',
    specialties: ['emagrecimento', 'saúde feminina'],
    instagram_url: 'https://instagram.com/patricialimanutrição',
    photo_gender: 'women', photo_index: 5,
    address: { line1: 'Rua Oscar Freire, 129', district: 'Cerqueira César', city: 'São Paulo', state: 'SP', postcode: '01426-001', lat: -23.5636, lng: -46.6713 },
    services: [
      { name: 'Consulta Comportamental', price: 260_00, duration: 75, modality: 'presencial' },
      { name: 'Programa 3 Meses',        price: 980_00, duration: 60, modality: 'online' },
      { name: 'Sessão Online',           price: 200_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Thais', last_name: 'Barbosa',
    email: 'thais.barbosa.nutri@discover-demo.orbi',
    business_name: 'Dra. Thais Barbosa',
    ratings_count: 88, ratings_average: 4.9, patients_count: 295,
    phone: '(11) 95073-6189',
    professional_registration: 'CRN-3 51634/P',
    description: 'Nutricionista pediatra especializada em alimentação infantil, introdução alimentar (BLW e BLWM) e nutrição na adolescência. Atendimento carinhoso para bebês, crianças e adolescentes.',
    specialties: ['infantil'],
    instagram_url: 'https://instagram.com/draThaisBarbosa',
    photo_gender: 'women', photo_index: 6,
    address: { line1: 'Rua Dr. Tomás Carvalhal, 305', district: 'Paraíso', city: 'São Paulo', state: 'SP', postcode: '04006-001', lat: -23.5742, lng: -46.6408 },
    services: [
      { name: 'Consulta Nutrição Infantil',  price: 230_00, duration: 60, modality: 'presencial' },
      { name: 'Orientação Introdução Alim.', price: 280_00, duration: 75, modality: 'presencial' },
      { name: 'Retorno Online',              price: 140_00, duration: 40, modality: 'online' },
    ]
  },
  {
    first_name: 'Ana Clara', last_name: 'Pereira',
    email: 'anaclara.pereira.nutri@discover-demo.orbi',
    business_name: 'Ana Clara Pereira',
    ratings_count: 73, ratings_average: 4.7, patients_count: 310,
    phone: '(41) 99234-5678',
    professional_registration: 'CRN-8 28047/P',
    description: 'Nutricionista clínica e funcional com foco em saúde hormonal, tireóide e síndrome dos ovários policísticos. Atendimento personalizado e baseado em evidências. Teleatendimento para todo o Brasil.',
    specialties: ['hormonal', 'saúde feminina'],
    instagram_url: 'https://instagram.com/anaclaranutri',
    photo_gender: 'women', photo_index: 7,
    address: { line1: 'Rua Emiliano Perneta, 297', district: 'Centro', city: 'Curitiba', state: 'PR', postcode: '80010-060', lat: -25.4290, lng: -49.2700 },
    services: [
      { name: 'Consulta Clínica Funcional', price: 240_00, duration: 60, modality: 'presencial' },
      { name: 'Programa Saúde Hormonal',    price: 720_00, duration: 90, modality: 'presencial' },
      { name: 'Retorno Online',             price: 150_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Felipe', last_name: 'Souza',
    email: 'felipe.souza.nutri@discover-demo.orbi',
    business_name: 'Felipe Souza Performance',
    ratings_count: 115, ratings_average: 4.8, patients_count: 450,
    phone: '(21) 97812-3390',
    professional_registration: 'CRN-4 19583/P',
    description: 'Nutricionista esportivo especializado em musculação, crossfit e corrida de rua. Protocolos individualizados para maximizar performance e recuperação muscular. Atendo presencial no Rio e online em todo Brasil.',
    specialties: ['esportiva', 'emagrecimento'],
    instagram_url: 'https://instagram.com/felipesouzanutri',
    photo_gender: 'men', photo_index: 3,
    address: { line1: 'Rua Visconde de Pirajá, 547', district: 'Ipanema', city: 'Rio de Janeiro', state: 'RJ', postcode: '22410-003', lat: -22.9854, lng: -43.2038 },
    services: [
      { name: 'Avaliação Esportiva',   price: 280_00, duration: 75, modality: 'presencial' },
      { name: 'Plano de Hipertrofia',  price: 520_00, duration: 90, modality: 'presencial' },
      { name: 'Acompanhamento Mensal', price: 350_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Mariana', last_name: 'Souza',
    email: 'mariana.souza.nutri@discover-demo.orbi',
    business_name: 'Mariana Souza Nutrição',
    phone: '(11) 97412-8830',
    professional_registration: 'CRN-3 68294/P',
    description: 'Nutricionista funcional com foco em detox, modulação intestinal e emagrecimento sustentável. Atendimento individualizado baseado em exames e rotina do paciente. Presencial em Vila Madalena e online.',
    specialties: ['emagrecimento', 'online'],
    instagram_url: 'https://instagram.com/marianasouz.nutri',
    photo_gender: 'women', photo_index: 8,
    ratings_count: 91, ratings_average: 4.8, patients_count: 340,
    address: { line1: 'Rua Harmonia, 422', district: 'Vila Madalena', city: 'São Paulo', state: 'SP', postcode: '05435-000', lat: -23.5541, lng: -46.6924 },
    services: [
      { name: 'Consulta Nutricional',  price: 230_00, duration: 60, modality: 'presencial' },
      { name: 'Programa Detox 21 dias', price: 590_00, duration: 60, modality: 'online' },
      { name: 'Retorno',               price: 140_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Rafael', last_name: 'Mendes',
    email: 'rafael.mendes.nutri@discover-demo.orbi',
    business_name: 'Rafael Mendes Esporte e Saúde',
    phone: '(11) 99031-5647',
    professional_registration: 'CRN-3 71058/P',
    description: 'Nutricionista esportivo especializado em corrida de rua, triathlon e natação. Periodização nutricional para competições e desempenho de alto nível. Parceiro oficial de clubes de corrida da zona sul.',
    specialties: ['esportiva', 'emagrecimento'],
    instagram_url: 'https://instagram.com/rafaelmendessport',
    photo_gender: 'men', photo_index: 4,
    ratings_count: 77, ratings_average: 4.9, patients_count: 290,
    address: { line1: 'Av. Brigadeiro Faria Lima, 2601', district: 'Itaim Bibi', city: 'São Paulo', state: 'SP', postcode: '01452-000', lat: -23.5843, lng: -46.6721 },
    services: [
      { name: 'Avaliação Esportiva Completa', price: 320_00, duration: 75, modality: 'presencial' },
      { name: 'Plano para Corrida/Triathlon', price: 580_00, duration: 90, modality: 'online' },
      { name: 'Retorno Mensal',               price: 160_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Isabela', last_name: 'Carmo',
    email: 'isabela.carmo.nutri@discover-demo.orbi',
    business_name: 'Isabela Carmo — Emagrecimento',
    phone: '(11) 94788-2310',
    professional_registration: 'CRN-3 59437/P',
    description: 'Especialista em emagrecimento com abordagem comportamental e emocional. Ajudo pessoas a reeducar a relação com a comida de forma definitiva, sem dietas restritivas. Mais de 400 pacientes transformados.',
    specialties: ['emagrecimento', 'saúde feminina'],
    instagram_url: 'https://instagram.com/isabelacarmonemagrecimento',
    photo_gender: 'women', photo_index: 9,
    ratings_count: 156, ratings_average: 4.9, patients_count: 430,
    address: { line1: 'Rua James Holland, 88', district: 'Brooklin', city: 'São Paulo', state: 'SP', postcode: '04726-050', lat: -23.6126, lng: -46.6968 },
    services: [
      { name: 'Consulta Comportamental',  price: 270_00, duration: 75, modality: 'presencial' },
      { name: 'Programa 90 dias',         price: 1_290_00, duration: 60, modality: 'online' },
      { name: 'Sessão de Retorno',        price: 170_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Gustavo', last_name: 'Nunes',
    email: 'gustavo.nunes.nutri@discover-demo.orbi',
    business_name: 'Dr. Gustavo Nunes',
    phone: '(11) 98654-7123',
    professional_registration: 'CRN-3 53881/P',
    description: 'Nutricionista clínico com doutorado em endocrinologia nutricional. Especialista em diabetes, resistência à insulina, obesidade e síndrome metabólica. Atendimento baseado em evidências científicas.',
    specialties: ['emagrecimento'],
    instagram_url: nil,
    photo_gender: 'men', photo_index: 5,
    ratings_count: 44, ratings_average: 4.7, patients_count: 198,
    address: { line1: 'Rua Nova Cintra, 15', district: 'Campo Belo', city: 'São Paulo', state: 'SP', postcode: '04613-030', lat: -23.6177, lng: -46.6644 },
    services: [
      { name: 'Consulta Metabólica',       price: 350_00, duration: 75, modality: 'presencial' },
      { name: 'Protocolo Diabetes/IR',     price: 650_00, duration: 90, modality: 'presencial' },
      { name: 'Teleconsulta',              price: 250_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Larissa', last_name: 'Alves',
    email: 'larissa.alves.nutri@discover-demo.orbi',
    business_name: 'Larissa Alves — Saúde Feminina',
    phone: '(11) 96923-0481',
    professional_registration: 'CRN-3 64712/P',
    description: 'Nutricionista especializada em saúde feminina, fertilidade, SOP, endometriose e menopausa. Atendimento acolhedor e personalizado para cada fase da vida da mulher. Teleatendimento disponível.',
    specialties: ['saúde feminina', 'gestação', 'hormonal'],
    instagram_url: 'https://instagram.com/larissaalvesnutri',
    photo_gender: 'women', photo_index: 10,
    ratings_count: 108, ratings_average: 4.9, patients_count: 475,
    address: { line1: 'Rua Cotoxó, 741', district: 'Perdizes', city: 'São Paulo', state: 'SP', postcode: '05021-000', lat: -23.5354, lng: -46.6647 },
    services: [
      { name: 'Consulta Saúde Feminina',  price: 260_00, duration: 60, modality: 'presencial' },
      { name: 'Programa Fertilidade',     price: 780_00, duration: 90, modality: 'online' },
      { name: 'Retorno',                  price: 150_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Renata', last_name: 'Cardoso',
    email: 'renata.cardoso.nutri@discover-demo.orbi',
    business_name: 'Dra. Renata Cardoso',
    phone: '(11) 97230-6084',
    professional_registration: 'CRN-3 47926/P',
    description: 'Nutricionista pediatra com mestrado em nutrição materno-infantil. Atendo bebês desde a introdução alimentar, crianças com seletividade e adolescentes. Método LOVE responsivo e BLW.',
    specialties: ['infantil', 'gestação'],
    instagram_url: 'https://instagram.com/drarenataCardoso',
    photo_gender: 'women', photo_index: 11,
    ratings_count: 134, ratings_average: 5.0, patients_count: 560,
    address: { line1: 'Rua Ministro Godói, 1204', district: 'Pompeia', city: 'São Paulo', state: 'SP', postcode: '05015-001', lat: -23.5264, lng: -46.6834 },
    services: [
      { name: 'Consulta Infantil',         price: 240_00, duration: 60, modality: 'presencial' },
      { name: 'Introdução Alimentar BLW',  price: 290_00, duration: 75, modality: 'presencial' },
      { name: 'Retorno Online',            price: 140_00, duration: 40, modality: 'online' },
    ]
  },
  {
    first_name: 'André', last_name: 'Ribeiro',
    email: 'andre.ribeiro.nutri@discover-demo.orbi',
    business_name: 'André Ribeiro — Low Carb',
    phone: '(11) 95187-3390',
    professional_registration: 'CRN-3 66340/P',
    description: 'Especialista em dietas low carb, cetogênica e jejum intermitente. Atendimento prático e sem radicalismos, focado em resultados duradouros para quem tem rotina agitada.',
    specialties: ['emagrecimento', 'esportiva'],
    instagram_url: 'https://instagram.com/andreribeirolowcarb',
    photo_gender: 'men', photo_index: 6,
    ratings_count: 62, ratings_average: 4.8, patients_count: 220,
    address: { line1: 'Rua Voluntários da Pátria, 1818', district: 'Santana', city: 'São Paulo', state: 'SP', postcode: '02011-000', lat: -23.5009, lng: -46.6279 },
    services: [
      { name: 'Consulta Nutricional',    price: 210_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Low Carb Completo', price: 450_00, duration: 75, modality: 'online' },
      { name: 'Retorno',                 price: 130_00, duration: 40, modality: 'online' },
    ]
  },
  {
    first_name: 'Vanessa', last_name: 'Dutra',
    email: 'vanessa.dutra.nutri@discover-demo.orbi',
    business_name: 'Vanessa Dutra Nutrição',
    phone: '(11) 98041-5720',
    professional_registration: 'CRN-3 52193/P',
    description: 'Nutricionista oncológica e clínica com ampla experiência em suporte nutricional para pacientes em tratamento de câncer, pós-cirúrgicos e em cuidados paliativos. Atendimento domiciliar disponível.',
    specialties: ['emagrecimento'],
    instagram_url: nil,
    photo_gender: 'women', photo_index: 12,
    ratings_count: 49, ratings_average: 4.9, patients_count: 185,
    address: { line1: 'Rua Domingos de Morais, 2564', district: 'Vila Mariana', city: 'São Paulo', state: 'SP', postcode: '04035-001', lat: -23.5870, lng: -46.6330 },
    services: [
      { name: 'Consulta Oncológica',      price: 280_00, duration: 60, modality: 'presencial' },
      { name: 'Acompanhamento Semanal',   price: 220_00, duration: 45, modality: 'online' },
      { name: 'Visita Domiciliar',        price: 380_00, duration: 90, modality: 'presencial' },
    ]
  },
  {
    first_name: 'Diego', last_name: 'Campos',
    email: 'diego.campos.nutri@discover-demo.orbi',
    business_name: 'Diego Campos Performance',
    phone: '(11) 99762-4483',
    professional_registration: 'CRN-3 73512/P',
    description: 'Nutricionista especializado em hipertrofia, recomposição corporal e powerlifting. Protocolos baseados em ciência para maximizar ganho muscular com inteligência. Atendo atletas amadores e profissionais.',
    specialties: ['esportiva'],
    instagram_url: 'https://instagram.com/diegocamposperformance',
    photo_gender: 'men', photo_index: 7,
    ratings_count: 85, ratings_average: 4.8, patients_count: 315,
    address: { line1: 'Av. Brigadeiro Luís Antônio, 3012', district: 'Bela Vista', city: 'São Paulo', state: 'SP', postcode: '01317-000', lat: -23.5597, lng: -46.6457 },
    services: [
      { name: 'Avaliação de Composição',   price: 290_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Hipertrofia Premium', price: 560_00, duration: 90, modality: 'presencial' },
      { name: 'Consultoria Online',        price: 220_00, duration: 50, modality: 'online' },
    ]
  },
  {
    first_name: 'Lívia', last_name: 'Torres',
    email: 'livia.torres.nutri@discover-demo.orbi',
    business_name: 'Lívia Torres — Plant-Based',
    phone: '(11) 96514-9037',
    professional_registration: 'CRN-3 60873/P',
    description: 'Nutricionista vegana e especialista em dietas plant-based, vegetarianismo e veganismo. Cardápios saborosos, nutritivos e sem carências. Consultora de restaurantes e empresas de alimentação saudável.',
    specialties: ['vegetariana', 'emagrecimento', 'online'],
    instagram_url: 'https://instagram.com/liviatorresplant',
    photo_gender: 'women', photo_index: 13,
    ratings_count: 119, ratings_average: 4.9, patients_count: 510,
    address: { line1: 'Rua Tuiuti, 890', district: 'Tatuapé', city: 'São Paulo', state: 'SP', postcode: '03307-001', lat: -23.5392, lng: -46.5684 },
    services: [
      { name: 'Consulta Plant-Based',    price: 220_00, duration: 60, modality: 'presencial' },
      { name: 'Cardápio Vegano Completo', price: 420_00, duration: 75, modality: 'online' },
      { name: 'Retorno',                 price: 130_00, duration: 40, modality: 'online' },
    ]
  },
].freeze

# Mapa de IDs Unsplash por perfil — headshots profissionais com crop=faces
DISCOVER_UNSPLASH = {
  ['women', 1]  => 'photo-1573496359142-b8d87734a5a2',
  ['women', 2]  => 'photo-1580489944761-15a19d654956',
  ['women', 3]  => 'photo-1594824476967-48c8b964273f',
  ['women', 4]  => 'photo-1551836022-d5d88e9218df',
  ['women', 5]  => 'photo-1529626455594-4ff0802cfb7e',
  ['women', 6]  => 'photo-1544005313-94ddf0286df2',
  ['women', 7]  => 'photo-1438761681033-6461ffad8d80',
  ['women', 8]  => 'photo-1494790108377-be9c29b29330',
  ['women', 9]  => 'photo-1573497019940-1c28c88b4f3e',
  ['women', 10] => 'photo-1559839734-2b71ea197ec2',
  ['women', 11] => 'photo-1489424731084-a5d8b219a5bb',
  ['women', 12] => 'photo-1517841905240-472988babdf9',
  ['women', 13] => 'photo-1534528741775-53994a69daeb',
  ['men',   1]  => 'photo-1519085360753-af0119f7cbe7',
  ['men',   2]  => 'photo-1472099645785-5658abf4ff4e',
  ['men',   3]  => 'photo-1507003211169-0a1dd7228f2d',
  ['men',   4]  => 'photo-1500648767791-00dcc994a43e',
  ['men',   5]  => 'photo-1560250097-0b93528c311a',
  ['men',   6]  => 'photo-1568602471122-7832951cc4c5',
  ['men',   7]  => 'photo-1492562080023-ab3db95bfbce',
}.freeze

def attach_photo(company, method_name, url, filename)
  io = URI.open(url, 'rb', read_timeout: 15, open_timeout: 10)
  blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: 'image/jpeg')
  ActiveStorage::Attachment.where(
    record_type: company.class.polymorphic_name,
    record_id:   company.id,
    name:        method_name.to_s
  ).delete_all
  ActiveStorage::Attachment.create!(
    record_type: company.class.polymorphic_name,
    record_id:   company.id,
    name:        method_name.to_s,
    blob_id:     blob.id
  )
rescue => e
  puts "    ⚠️  Foto '#{method_name}' falhou (#{e.class}: #{e.message})"
end

puts "\n#{'='*70}"
puts '🥦 CRIANDO NUTRICIONISTAS COM ENDEREÇOS, COORDENADAS E FOTOS'
puts "#{'='*70}\n"

created = 0; skipped = 0; errors = 0

NUTRIS.each_with_index do |p, idx|
  cover_seed = idx + 1
  print "👤 #{p[:business_name]}..."

  if User.exists?(email: p[:email])
    puts ' já existe, pulando.'
    skipped += 1
    next
  end

  begin
    ActiveRecord::Base.transaction do
      user = User.new(
        email: p[:email], first_name: p[:first_name], last_name: p[:last_name],
        password: 'nutri123', password_confirmation: 'nutri123',
        confirmed_at: Time.current, accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current, terms_of_service: '1',
        preferred_language: 'pt-BR'
      )
      user.skip_confirmation!
      user.save!

      account = user.reload.account
      company = account.company
      company.update!(
        screen_name: p[:business_name],
        cell_phone_number: p[:phone]
      )

      addr = p[:address]
      company.addresses.create!(
        address_line1: addr[:line1],
        district:      addr[:district],
        city:          addr[:city],
        state:         addr[:state],
        postcode:      addr[:postcode],
        country:       'BR',
        latitude:      addr[:lat],
        longitude:     addr[:lng]
      )

      account.update!(
        directory_visible:         true,
        profession_category:       'Nutricionista',
        directory_description:     p[:description],
        specialties:               p[:specialties],
        instagram_url:             p[:instagram_url],
        professional_registration: p[:professional_registration],
        subscription_status:       'active',
        preferences:               {
          'ratings_count'    => p[:ratings_count],
          'ratings_average'  => p[:ratings_average],
          'patients_count'   => p[:patients_count],
        }
      )

      p[:services].each do |svc|
        account.services.create!(
          name: svc[:name], selling_price_cents: svc[:price],
          currency: 'BRL', enabled: true,
          metadata: { duration_minutes: svc[:duration], modality: svc[:modality] }
        )
      end

      account.appointment_links.create!(
        name: "Agendar com #{p[:business_name]}",
        token: SecureRandom.hex(16), active: true, settings: {}
      )

      # Fotos
      unsplash_id = DISCOVER_UNSPLASH[[p[:photo_gender], p[:photo_index]]]
      logo_url    = unsplash_id ? "https://images.unsplash.com/#{unsplash_id}?w=400&h=400&fit=crop&crop=faces&auto=format&q=85" : nil
      cover_url   = "https://picsum.photos/seed/nutri#{cover_seed}/1200/400"
      attach_photo(company, :logo, logo_url, "#{unsplash_id}.jpg") if logo_url
      attach_photo(company, :cover_image, cover_url, "cover_nutri#{cover_seed}.jpg")

      puts " ✅ #{addr[:district]}, #{addr[:city]}"
      created += 1
    end
  rescue => e
    puts " ❌ #{e.message}"
    errors += 1
  end
end

puts "\n#{'='*70}"
puts "✅ Criados: #{created}  |  ⏭ Pulados: #{skipped}  |  ❌ Erros: #{errors}"
puts "#{'='*70}\n"
