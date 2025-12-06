#!/usr/bin/env python3
"""
Script para atualizar cores antigas restantes (opacidades, shadows, etc)
"""
import re
import os
from pathlib import Path

# Substituições adicionais
REPLACEMENTS = [
    # Gradientes com opacidade
    (r'from-pink-400\s+to-purple-400', 'from-[#6B8FA3] to-[#5B7A9E]'),
    (r'from-pink-500/20\s+to-purple-500/20', 'from-[#5B7A9E]/20 to-[#6B8FA3]/20'),
    (r'from-pink-500/10\s+to-purple-500/10', 'from-[#5B7A9E]/10 to-[#6B8FA3]/10'),
    (r'from-pink-400\s+via-purple-400\s+to-indigo-400', 'from-[#6B8FA3] via-[#5B7A9E] to-[#7A9D96]'),
    (r'via-purple-400\s+to-indigo-400', 'via-[#5B7A9E] to-[#7A9D96]'),
    (r'via-blue-400\s+to-purple-400', 'via-[#6B8FA3] to-[#5B7A9E]'),
    (r'from-cyan-400\s+via-blue-400\s+to-purple-400', 'from-[#7A9D96] via-[#6B8FA3] to-[#5B7A9E]'),
    (r'from-pink-400\s+to-rose-500', 'from-[#6B8FA3] to-[#D4A574]'),
    (r'from-pink-500/20\s+via-purple-500/20\s+to-indigo-500/20', 'from-[#5B7A9E]/20 via-[#6B8FA3]/20 to-[#7A9D96]/20'),
    
    # Shadows
    (r'shadow-pink-500/30', 'shadow-[#5B7A9E]/30'),
    (r'shadow-purple-500/30', 'shadow-[#5B7A9E]/30'),
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

