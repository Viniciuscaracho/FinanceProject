#!/bin/bash

# Script para configurar credenciais do Stripe no BarberManagement

echo "🔧 Configurando credenciais do Stripe para BarberManagement"
echo ""

# Verificar se o arquivo de credenciais existe
if [ ! -f "config/master.key" ]; then
    echo "⚠️  Arquivo master.key não encontrado."
    echo "📝 Criando novo arquivo de credenciais..."
    echo ""
    echo "Execute manualmente:"
    echo "  rails credentials:edit"
    echo ""
    echo "E adicione o seguinte conteúdo:"
    echo ""
    echo "barber_management:"
    echo "  stripe:"
    echo "    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U"
    echo "    webhook_secret: \"\" # Adicione quando configurar o webhook"
    echo ""
    echo "stripe:"
    echo "  private_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U"
    echo "  webhook_secret: \"\" # Adicione quando configurar o webhook"
    echo ""
    exit 1
fi

echo "✅ Arquivo master.key encontrado"
echo ""
echo "📝 Para editar as credenciais, execute:"
echo "   rails credentials:edit"
echo ""
echo "E adicione:"
echo ""
echo "barber_management:"
echo "  stripe:"
echo "    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U"
echo ""

