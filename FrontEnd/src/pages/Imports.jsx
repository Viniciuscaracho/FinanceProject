import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FluidSection } from '@/components/design'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Upload, 
  Search, 
  Filter, 
  Trash2,
  Archive,
  ArchiveRestore,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

const stateLabels = {
  waiting: 'Aguardando',
  in_progress: 'Em progresso',
  done: 'Concluído',
  failed: 'Falhou'
}

const stateColors = {
  waiting: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  done: 'bg-green-500/10 text-green-600 dark:text-green-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400'
}

const sourceLabels = {
  zero_paper: 'Zero Paper',
  xlsx_contacts: 'Planilha de Contatos',
  xlsx_default: 'Planilha Padrão'
}

export function Imports() {
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [imports, setImports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadSource, setUploadSource] = useState('xlsx_default')
  const [refreshInterval, setRefreshInterval] = useState(null)

  const fetchImports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {}
      if (searchQuery) filters.q = searchQuery
      if (selectedState !== 'all') filters.state = selectedState
      if (selectedSource !== 'all') filters.source = selectedSource

      const response = await apiService.getImports(currentPage, 20, filters)
      
      setImports(response.imports || [])
      setTotalPages(response.meta?.total_pages || 1)
      setTotalCount(response.meta?.total_count || 0)
    } catch (err) {
      console.error('Erro ao buscar importações:', err)
      setError(err.message || 'Erro ao carregar importações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImports()
  }, [currentPage, selectedState, selectedSource])

  // Atualizar automaticamente se houver importações em progresso
  useEffect(() => {
    const hasInProgress = imports.some(imp => 
      imp.state === 'waiting' || imp.state === 'in_progress'
    )

    if (hasInProgress) {
      // Atualizar a cada 3 segundos se houver importações em progresso
      const interval = setInterval(() => {
        fetchImports()
      }, 3000)
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [imports])

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Selecione um arquivo para importar')
      return
    }

    try {
      setUploading(true)
      setError(null)

      await apiService.createImport({
        file: uploadFile,
        source: uploadSource
      })

      setIsUploadOpen(false)
      setUploadFile(null)
      setUploadSource('xlsx_default')
      await fetchImports()
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError(err.message || 'Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta importação?')) {
      return
    }

    try {
      await apiService.deleteImport(id)
      await fetchImports()
    } catch (err) {
      console.error('Erro ao remover importação:', err)
      setError(err.message || 'Erro ao remover importação')
    }
  }

  const handleDiscard = async (id) => {
    try {
      await apiService.discardImport(id)
      await fetchImports()
    } catch (err) {
      console.error('Erro ao arquivar importação:', err)
      setError(err.message || 'Erro ao arquivar importação')
    }
  }

  const handleUndiscard = async (id) => {
    try {
      await apiService.undiscardImport(id)
      await fetchImports()
    } catch (err) {
      console.error('Erro ao restaurar importação:', err)
      setError(err.message || 'Erro ao restaurar importação')
    }
  }

  const getStateIcon = (state) => {
    switch (state) {
      case 'waiting':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'done':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] bg-clip-text text-transparent">
                Importações
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Gerencie suas importações de arquivos
            </p>
          </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full md:w-auto bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
            >
              <Upload className="h-4 w-4 mr-2" />
              Nova Importação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Importação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Importação
                </label>
                <Select value={uploadSource} onValueChange={setUploadSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx_default">Planilha Padrão</SelectItem>
                    <SelectItem value="xlsx_contacts">Planilha de Contatos</SelectItem>
                    <SelectItem value="zero_paper">Zero Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Arquivo
                </label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros - Modern Style */}
      <FluidSection
        title="Filtros e Busca"
        subtitle="Encontre suas importações"
        gradient="from-[#5B7A9E] to-[#6B8FA3]"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchImports()
                  }
                }}
                className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
              />
            </div>
          </div>
          <Select value={selectedState} onValueChange={(value) => {
            setSelectedState(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-full md:w-[180px] backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="waiting">Aguardando</SelectItem>
              <SelectItem value="in_progress">Em progresso</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSource} onValueChange={(value) => {
            setSelectedSource(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-full md:w-[180px] backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              <SelectItem value="xlsx_default">Planilha Padrão</SelectItem>
              <SelectItem value="xlsx_contacts">Planilha de Contatos</SelectItem>
              <SelectItem value="zero_paper">Zero Paper</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FluidSection>

      {/* Erro */}
      {error && !isUploadOpen && (
        <div className="p-4 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Tabela - Modern Style */}
      <FluidSection
        title={totalCount > 0 ? `${totalCount} importação${totalCount !== 1 ? 'ões' : ''}` : 'Nenhuma importação encontrada'}
        subtitle="Gerencie suas importações de arquivos"
        gradient="from-blue-500 to-indigo-500"
      >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma importação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((importItem) => (
                    <TableRow key={importItem.id}>
                      <TableCell className="font-medium">
                        {importItem.file_name || 'Sem arquivo'}
                      </TableCell>
                      <TableCell>
                        {sourceLabels[importItem.source] || importItem.source}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(stateColors[importItem.state])}>
                          <span className="flex items-center gap-1">
                            {getStateIcon(importItem.state)}
                            {stateLabels[importItem.state] || importItem.state}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress 
                            value={importItem.progress} 
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {Math.round(importItem.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {importItem.transactions_count || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(importItem.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {importItem.discarded_at ? (
                              <DropdownMenuItem
                                onClick={() => handleUndiscard(importItem.id)}
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Restaurar
                              </DropdownMenuItem>
                            ) : (
                              <>
                                {importItem.able_to_discard && (
                                  <DropdownMenuItem
                                    onClick={() => handleDiscard(importItem.id)}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Arquivar
                                  </DropdownMenuItem>
                                )}
                                {importItem.able_to_destroy && (
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(importItem.id)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </FluidSection>
      </div>
    </div>
  )
}

