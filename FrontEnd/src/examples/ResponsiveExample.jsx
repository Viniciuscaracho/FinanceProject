/**
 * Exemplo de uso da metodologia Cal.com
 * Demonstra como usar os hooks e componentes responsivos
 */

import { useIsMobile, useBreakpoint, useBreakpointAtLeast } from '@/hooks/use-mobile'
import { useResponsive, useOrientation } from '@/hooks/use-responsive'
import { ResponsiveContainer, ResponsiveShow, ResponsiveHide } from '@/components/ui/responsive-container'
import { Button } from '@/components/ui/button'

export function ResponsiveExample() {
  // Hook básico
  const isMobile = useIsMobile()
  const breakpoint = useBreakpoint()
  const isDesktop = useBreakpointAtLeast('lg')

  // Hook completo
  const responsive = useResponsive()
  const { orientation, isPortrait } = useOrientation()

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Exemplos de Responsividade</h1>

      {/* Exemplo 1: Detecção básica */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">1. Detecção Básica</h2>
        <div className="space-y-2 text-sm">
          <p>Está em mobile: {isMobile ? '✅ Sim' : '❌ Não'}</p>
          <p>Breakpoint atual: <strong>{breakpoint}</strong></p>
          <p>É desktop (lg+): {isDesktop ? '✅ Sim' : '❌ Não'}</p>
        </div>
      </section>

      {/* Exemplo 2: Hook completo */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">2. Hook Completo</h2>
        <div className="space-y-2 text-sm">
          <p>Breakpoint: <strong>{responsive.breakpoint}</strong></p>
          <p>Largura: <strong>{responsive.width}px</strong></p>
          <p>Altura: <strong>{responsive.height}px</strong></p>
          <p>Mobile: {responsive.isMobile ? '✅' : '❌'}</p>
          <p>Tablet: {responsive.isTablet ? '✅' : '❌'}</p>
          <p>Desktop: {responsive.isDesktop ? '✅' : '❌'}</p>
          <p>Large Desktop: {responsive.isLargeDesktop ? '✅' : '❌'}</p>
        </div>
      </section>

      {/* Exemplo 3: Orientação */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">3. Orientação</h2>
        <div className="text-sm">
          <p>Orientação: <strong>{orientation}</strong></p>
          <p>Modo Retrato: {isPortrait ? '✅' : '❌'}</p>
        </div>
      </section>

      {/* Exemplo 4: ResponsiveContainer */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">4. ResponsiveContainer</h2>
        <ResponsiveContainer
          className="bg-blue-100 p-4 rounded"
          mobileClassName="bg-red-100 text-sm"
          tabletClassName="bg-yellow-100 text-base"
          desktopClassName="bg-green-100 text-lg"
        >
          <p>Este container muda de cor e tamanho baseado no breakpoint</p>
        </ResponsiveContainer>
      </section>

      {/* Exemplo 5: ResponsiveShow/Hide */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">5. Mostrar/Esconder</h2>
        
        <ResponsiveShow above="lg">
          <div className="bg-green-200 p-2 rounded mb-2">
            ✅ Visível apenas em desktop (lg+)
          </div>
        </ResponsiveShow>

        <ResponsiveHide above="lg">
          <div className="bg-red-200 p-2 rounded mb-2">
            ✅ Visível apenas em mobile/tablet
          </div>
        </ResponsiveHide>

        <ResponsiveShow only="md">
          <div className="bg-yellow-200 p-2 rounded mb-2">
            ✅ Visível apenas em tablet (md)
          </div>
        </ResponsiveShow>
      </section>

      {/* Exemplo 6: Botões Touch-Friendly */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">6. Botões Mobile-Friendly</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Pequeno</Button>
          <Button size="default">Padrão</Button>
          <Button size="lg">Grande</Button>
          <Button size="icon">📱</Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Todos os botões têm área mínima de toque de 44x44px
        </p>
      </section>

      {/* Exemplo 7: Classes Tailwind Responsivas */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">7. Classes Tailwind</h2>
        <div className="
          text-sm          /* Mobile */
          md:text-base     /* Tablet */
          lg:text-lg       /* Desktop */
          xl:text-xl       /* Large Desktop */
          p-2              /* Mobile */
          md:p-4           /* Tablet */
          lg:p-6           /* Desktop */
          bg-gray-100      /* Mobile */
          md:bg-gray-200   /* Tablet */
          lg:bg-gray-300   /* Desktop */
          rounded
        ">
          Este texto e padding mudam baseado no breakpoint
        </div>
      </section>

      {/* Exemplo 8: Layout Condicional */}
      <section className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">8. Layout Condicional</h2>
        {responsive.isMobile ? (
          <div className="space-y-2">
            <div className="bg-blue-200 p-2 rounded">Item 1</div>
            <div className="bg-blue-200 p-2 rounded">Item 2</div>
            <div className="bg-blue-200 p-2 rounded">Item 3</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-200 p-2 rounded">Item 1</div>
            <div className="bg-green-200 p-2 rounded">Item 2</div>
            <div className="bg-green-200 p-2 rounded">Item 3</div>
          </div>
        )}
      </section>
    </div>
  )
}
