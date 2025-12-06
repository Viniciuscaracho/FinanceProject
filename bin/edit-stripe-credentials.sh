#!/bin/bash

# Script para editar credenciais do Stripe

echo "🔧 Editando credenciais do Stripe para desenvolvimento..."
echo ""
echo "📝 O editor nano será aberto."
echo "   - Use as setas para navegar"
echo "   - Adicione ou atualize as seções barber_management e stripe"
echo "   - Para salvar: Ctrl+X, depois Y, depois Enter"
echo ""
echo "Pressione Enter para continuar..."
read

# Tentar diferentes editores
if command -v nano &> /dev/null; then
    EDITOR=nano rails credentials:edit --environment development
elif command -v vim &> /dev/null; then
    EDITOR=vim rails credentials:edit --environment development
elif command -v code &> /dev/null; then
    EDITOR="code --wait" rails credentials:edit --environment development
else
    echo "❌ Nenhum editor encontrado. Configure o EDITOR:"
    echo "   export EDITOR=nano"
    echo "   rails credentials:edit --environment development"
    exit 1
fi

echo ""
echo "✅ Credenciais editadas!"
echo ""
echo "🔄 Agora reinicie o servidor Rails:"
echo "   rails server"
echo "   ou"
echo "   bin/dev"

