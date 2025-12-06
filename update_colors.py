#!/usr/bin/env python3
"""
Script para atualizar cores antigas (pink/purple) para nova paleta neutra
"""
import re
import os
from pathlib import Path

# Mapeamento de substituições
REPLACEMENTS = [
    # Gradientes principais
    (r'from-pink-500\s+to-purple-500', 'from-[#5B7A9E] to-[#6B8FA3]'),
    (r'from-pink-500\s+via-purple-500\s+to-indigo-500', 'from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96]'),
    (r'from-purple-500\s+to-pink-500', 'from-[#5B7A9E] to-[#6B8FA3]'),
    (r'from-indigo-500\s+to-purple-500', 'from-[#5B7A9E] to-[#6B8FA3]'),
    (r'from-blue-500\s+to-purple-500', 'from-[#5B7A9E] to-[#6B8FA3]'),
    (r'from-purple-400\s+to-pink-500', 'from-[#6B8FA3] to-[#5B7A9E]'),
    (r'from-blue-600\s+to-purple-600', 'from-[#5B7A9E] to-[#6B8FA3]'),
    (r'from-blue-400\s+to-purple-500', 'from-[#5B7A9E] to-[#6B8FA3]'),
    
    # Hover states
    (r'hover:from-pink-600\s+hover:to-purple-600', 'hover:from-[#4A5C7A] hover:to-[#5B7A9E]'),
    
    # Cores de texto
    (r'text-purple-600', 'text-[#5B7A9E]'),
    (r'text-purple-500', 'text-[#5B7A9E]'),
    (r'text-purple-400', 'text-[#6B8FA3]'),
    (r'text-pink-600', 'text-[#5B7A9E]'),
    (r'text-pink-500', 'text-[#5B7A9E]'),
    (r'text-pink-400', 'text-[#6B8FA3]'),
    
    # Backgrounds
    (r'bg-purple-50', 'bg-[#E8F0F5]'),
    (r'bg-purple-500', 'bg-[#5B7A9E]'),
    (r'bg-purple-600', 'bg-[#5B7A9E]'),
    (r'bg-pink-500', 'bg-[#5B7A9E]'),
    
    # Bordas
    (r'border-purple-200', 'border-[#6B8FA3]'),
    (r'border-purple-600', 'border-[#5B7A9E]'),
    (r'hover:border-purple-300', 'hover:border-[#6B8FA3]'),
    (r'hover:border-purple-600', 'hover:border-[#5B7A9E]'),
]

def update_file(file_path):
    """Atualiza um arquivo com as novas cores"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = 0
        
        for pattern, replacement in REPLACEMENTS:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes += len(re.findall(pattern, content))
                content = new_content
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes
        
        return 0
    except Exception as e:
        print(f"Erro ao processar {file_path}: {e}")
        return 0

def main():
    """Processa todos os arquivos JSX no diretório FrontEnd/src"""
    base_dir = Path('FrontEnd/src')
    
    # Arquivos para processar
    files_to_process = []
    
    # Páginas
    pages_dir = base_dir / 'pages'
    if pages_dir.exists():
        files_to_process.extend(pages_dir.glob('*.jsx'))
    
    # Componentes
    components_dir = base_dir / 'components'
    if components_dir.exists():
        files_to_process.extend(components_dir.rglob('*.jsx'))
    
    total_changes = 0
    files_changed = 0
    
    for file_path in files_to_process:
        changes = update_file(file_path)
        if changes > 0:
            files_changed += 1
            total_changes += changes
            print(f"✅ {file_path.relative_to(base_dir)}: {changes} substituições")
    
    print(f"\n📊 Resumo:")
    print(f"   Arquivos alterados: {files_changed}")
    print(f"   Total de substituições: {total_changes}")

if __name__ == '__main__':
    main()

