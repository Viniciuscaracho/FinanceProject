# README

Este README normalmente documenta quaisquer passos necessários para colocar a aplicação em funcionamento.

O motivo pelo qual vamos usar o Ubuntu é porque a maioria do código que você escreve será executada em um servidor Linux. O Ubuntu é uma das distribuições Linux mais fáceis de usar, com muita documentação, por isso é uma ótima opção para começar.

## Instalação do Ruby On Rails no Ubuntu 22.04 Jammy Jellyfish

O primeiro passo é instalar as dependências para compilar o Ruby. Abra o seu Terminal e execute os seguintes comandos para instalá-las.

## Instalação do Ruby On Rails no macOs 14 Sonoma

Instalando o Homebrew, abra o terminal e execute o seguinte comando

- `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### Instalando o Ruby

#### Ubuntu 22.04 / Debian
- `sudo apt-get update`
- `sudo apt-get install imagemagick libpq-dev
  fonts-inter fonts-liberation ca-certificates libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6
  libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils`

#### Macos
- `brew install imagemagick`
- `brew install ghostscript`

Em seguida, vamos instalar o Ruby usando um gerenciador de versões chamado ASDF.

O motivo pelo qual usamos o ASDF em vez do rbenv, rvm ou outros é que o ASDF pode gerenciar outras linguagens como Node.js também.

A instalação do asdf é um processo simples de dois passos. Primeiro você instala o asdf e depois o adiciona ao seu shell:

- `cd`
- `git clone https://github.com/excid3/asdf.git ~/.asdf`
- `echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc`
- `echo '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.bashrc`
- `echo 'legacy_version_file = yes' >> ~/.asdfrc`
- `echo 'export EDITOR="code --wait"' >> ~/.bashrc`
- `exec $SHELL`

Então, podemos instalar os plugins do ASDF para cada linguagem que queremos usar. Para o Rails, podemos instalar o Ruby e o Node.js para nosso Javascript frontend.

- `asdf plugin add ruby`
- `asdf plugin add nodejs`

### Ruby version
- v3.1.2

Para instalar o Ruby e definir a versão padrão, vamos executar os seguintes comandos:

- `asdf install ruby 3.1.2`
- `asdf global ruby 3.1.2`
- `# Update to the latest Rubygems version`
- `gem update --system`

Confirme que a versão padrão do Ruby corresponde à versão que você acabou de instalar.

- `which ruby`
- `#=> /home/username/.asdf/shims/ruby`
- `ruby -v`
- `#=> 3.1.2`

Então, podemos instalar a última versão do Node.js para lidar com Javascript em nossos aplicativos Rails:

- `asdf install nodejs 16.20.2`
- `asdf global nodejs 16.20.2`
- `which node`
- `#=> /home/username/.asdf/shims/node`
- `node -v`
- `#=> 16.20.2`
- `#Instale o yarn para jsbundling/cssbundling do Rails ou webpacker`
- `npm install -g yarn`

### Configurando o Git

Vamos usar o Git como nosso sistema de controle de versão, então vamos configurá-lo para corresponder à nossa conta do Github.Se você ainda não tem uma conta no Github, certifique-se de se registrar. Será útil para o futuro.
Substitua SEU NOME e endereço de e-mail nos passos seguintes pelos que você usou para a sua conta do Github.

- `git config --global color.ui true`
- `git config --global user.name "SEU NOME"`
- `git config --global user.email "SEU@EMAIL.com"`
- `ssh-keygen -t ed25519 -C "SEU@EMAIL.com"`

O próximo passo é pegar a chave SSH recém-gerada e adicioná-la à sua conta do Github. Você vai querer copiar e colar a saída do seguinte comando e colá-la [aqui](https://github.com/settings/ssh).

- `cat ~/.ssh/id_ed25519.pub`

Depois de ter feito isso, você pode verificar e ver se funcionou

- `ssh -T git@github.com`

Você deve receber uma mensagem como esta:

- `Hi excid3! You've successfully authenticated, but GitHub does not provide shell access.`

### Conectando-se ao Git:

Abra o terminal e navegue até a pasta onde deseja colocar seus códigos

Clone o repositório do projeto. Substitua <ssh-do-repositório> pela chave de autenticação do repositório do GitHub que contém os arquivos do seu trabalho

- `git clone <ssh-do-repositório>`

Agora você deve ter os arquivos do seu trabalho na sua máquina local.

## Instalando o Rails

Escolha a versão 7.0.8

- `gem install rails -v 7.0.8`

Agora que você instalou o Rails, você pode executar o comando `rails -v` para ter certeza de que tudo foi instalado corretamente:

- `rails -v`
- `# Rails 7.0.8`

## Configurando o Docker

#### Instalação do Docker Desktop no Ubuntu

- `sudo apt update`
- `sudo apt install apt-transport-https curl software-properties-common`
- `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg`
- `echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`
- `sudo apt update`
- `apt-cache policy docker-ce`
- `sudo apt install docker-ce`

Executando Docker sem Sudo

- `sudo usermod -aG docker ${USER}`
- `su - ${USER}`

Confirm that your user is now added to the docker group by typing:

- `groups`

## Instalando o Docker Compose

- `mkdir -p ~/.docker/cli-plugins/`
- `curl -SL https://github.com/docker/compose/releases/download/v2.3.3/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose`
- `chmod +x ~/.docker/cli-plugins/docker-compose`
- `docker-compose version`

## Configuração do Projeto

Antes de iniciar a execução do projeto é preciso configurá-lo executar os seguintes comandos no terminal da pasta do projeto:
- `bundle install`
- `yarn install` (não utilizar npm)
- `docker-compose up`

Em outro terminal, executar os seguintes comandos do Rails:
- `rails db:create`
- `rails db:migrate`

## Executando o projeto

Agora podemos executar a aplicação:
- `bin/dev`