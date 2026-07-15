# frozen_string_literal: true

require 'test_helper'

class Coaching::ExtractFileServiceTest < ActiveSupport::TestCase
  def fake_file(content:, filename:, content_type:)
    Rack::Test::UploadedFile.new(
      StringIO.new(content),
      content_type,
      original_filename: filename
    )
  end

  def minimal_docx(text)
    io = Zip::OutputStream.write_buffer do |zip|
      zip.put_next_entry('[Content_Types].xml')
      zip.write(<<~XML)
        <?xml version="1.0"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Override PartName="/word/document.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>
      XML

      zip.put_next_entry('word/document.xml')
      zip.write(<<~XML)
        <?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body><w:p><w:r><w:t>#{text}</w:t></w:r></w:p></w:body>
        </w:document>
      XML
    end
    io.string
  end

  # ── TXT ─────────────────────────────────────────────────────────────────────

  test 'extrai texto de arquivo TXT' do
    file = fake_file(content: "sono ótimo\ntreino leve", filename: 'nota.txt', content_type: 'text/plain')
    result = Coaching::ExtractFileService.new(file).call
    assert_equal "sono ótimo\ntreino leve", result
  end

  test 'retorna nil para TXT vazio' do
    file = fake_file(content: '   ', filename: 'vazio.txt', content_type: 'text/plain')
    assert_nil Coaching::ExtractFileService.new(file).call
  end

  test 'detecta TXT pela extensão quando content_type é octet-stream' do
    file = fake_file(content: 'conteúdo', filename: 'nota.txt', content_type: 'application/octet-stream')
    assert_equal 'conteúdo', Coaching::ExtractFileService.new(file).call
  end

  # ── DOCX ────────────────────────────────────────────────────────────────────

  test 'extrai texto de DOCX válido' do
    data = minimal_docx('atleta com dor no joelho')
    file = fake_file(
      content:      data,
      filename:     'anamnese.docx',
      content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    result = Coaching::ExtractFileService.new(file).call
    assert_includes result, 'atleta com dor no joelho'
  end

  test 'retorna nil para DOCX sem word/document.xml' do
    broken = Zip::OutputStream.write_buffer { |z| z.put_next_entry('outro.xml'); z.write('<x/>') }.string
    file = fake_file(
      content:      broken,
      filename:     'quebrado.docx',
      content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    assert_nil Coaching::ExtractFileService.new(file).call
  end

  test 'retorna nil para DOCX corrompido (não é zip)' do
    file = fake_file(
      content:      'isso nao e um zip',
      filename:     'corrompido.docx',
      content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    assert_nil Coaching::ExtractFileService.new(file).call
  end

  # ── PDF ─────────────────────────────────────────────────────────────────────

  test 'extrai texto de PDF via pdftotext' do
    file = fake_file(content: '%PDF-1.4 fake', filename: 'laudo.pdf', content_type: 'application/pdf')
    Open3.stubs(:capture3).returns(["texto extraído do pdf\n", '', stub(success?: true)])

    result = Coaching::ExtractFileService.new(file).call
    assert_equal 'texto extraído do pdf', result
  end

  test 'retorna nil quando pdftotext falha' do
    file = fake_file(content: '%PDF', filename: 'corrompido.pdf', content_type: 'application/pdf')
    Open3.stubs(:capture3).returns(['', 'error', stub(success?: false)])

    assert_nil Coaching::ExtractFileService.new(file).call
  end

  # ── supported? ──────────────────────────────────────────────────────────────

  test 'supported? reconhece tipos suportados por content_type' do
    assert Coaching::ExtractFileService.supported?('application/pdf')
    assert Coaching::ExtractFileService.supported?('text/plain')
    assert Coaching::ExtractFileService.supported?(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  end

  test 'supported? reconhece tipos suportados por extensão' do
    assert Coaching::ExtractFileService.supported?('application/octet-stream', 'doc.pdf')
    assert Coaching::ExtractFileService.supported?('application/octet-stream', 'doc.docx')
    assert Coaching::ExtractFileService.supported?('application/octet-stream', 'doc.txt')
  end

  test 'supported? rejeita tipos não suportados' do
    refute Coaching::ExtractFileService.supported?('image/png', 'foto.png')
    refute Coaching::ExtractFileService.supported?('audio/webm', 'audio.webm')
  end
end
