class SeedHelpUser < ActiveRecord::Migration[7.0]
  def up
    MediumArticle.create!(description: "Como realizar o pagamento da assinatura por boleto bancário", link: "https://medium.com/procfy/como-realizar-o-pagamento-da-assinatura-por-boleto-banc%C3%A1rio-d548b3c7d35f")
    MediumArticle.create!(description: "Como utilizar a versão mobile do Procfy", link: "https://medium.com/procfy/como-utilizar-a-vers%C3%A3o-mobile-do-procfy-928fd530660d")
    MediumArticle.create!(description: "Como fazer uma assinatura e gerenciá-la no Procfy", link: "https://medium.com/procfy/como-fazer-uma-assinatura-e-gerenci%C3%A1-la-no-procfy-e13b396a31f")
    MediumArticle.create!(description: "Como realizar uma conciliação bancária? (importação do extrato bancário OFX)", link: "https://medium.com/procfy/como-realizar-uma-concilia%C3%A7%C3%A3o-banc%C3%A1ria-importa%C3%A7%C3%A3o-do-extrato-banc%C3%A1rio-ofx-8dfb0c49f307")
    MediumArticle.create!(description: "Como anexar arquivos no Procfy", link: "https://medium.com/procfy/como-anexar-arquivos-no-procfy-d2c936b5d808")
    MediumArticle.create!(description: "Exportando relatórios do Procfy para o Excel", link: "https://medium.com/procfy/exportando-relat%C3%B3rios-do-procfy-para-o-excel-9b6de13b710e")
    MediumArticle.create!(description: "Como detalhar valores em uma transação", link: "https://medium.com/procfy/como-detalhar-valores-em-uma-transa%C3%A7%C3%A3o-460323ecb448")
    MediumArticle.create!(description: "Importando dados de outros sistemas no Procfy via planilha Excel", link: "https://medium.com/procfy/formatando-corretamente-a-planilha-de-importa%C3%A7%C3%B5es-no-procfy-180a9fa8bc38")

    YoutubeVideo.create!(title: "Aula 1 - Dando os primeiros passos no Procfy", description: "Conheça o Procfy e aprenda as principais operações nesta aula.", link: "https://www.youtube.com/embed/B1TwpZAK95A?si=fMsSgtC5NkKWn9Sr", youtube_video_id: "B1TwpZAK95A")

  end

  def down
    HelpUser.destroy_all
  end
end
