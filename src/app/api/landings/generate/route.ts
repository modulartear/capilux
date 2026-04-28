import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function buildFallbackCopy(productName: string, description: string, price: number) {
  const priceStr = `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  return {
    headline: `${productName} - Transforma tu Salud Hoy`,
    subheadline: `Descubri el secreto que ya miles de personas estan disfrutando. ${priceStr}.`,
    problem: `Todos los dias, millones de personas luchan con problemas de salud que afectan su calidad de vida. La fatiga constante, la falta de energia y el malestar general te impiden disfrutar plenamente de cada momento. Sentis que nada funciona y que siempre estas atrasado con sus metas.`,
    solution: `Con ${productName}, tenes una solucion respaldada por ciencia y formulada con los mejores ingredientes. Cada capsula esta disenada para brindarte resultados reales que podes sentir desde la primera semana. Miles de personas ya lo comprueban.`,
    benefits: JSON.stringify([
      { title: 'Resultados Rapidos', description: 'Senti la diferencia en tu cuerpo desde los primeros 15 dias de uso constante.' },
      { title: 'Formula Natural', description: 'Ingredientes 100% naturales y seleccionados por especialistas en nutricion.' },
      { title: 'Maxima Absorcion', description: 'Tecnologia de absorcion avanzada que garantiza que tu cuerpo aproveche cada nutriente.' },
      { title: 'Calidad Premium', description: 'Fabricado bajo los mas estrictos estandares de calidad y control.' },
      { title: 'Sin Efectos Secundarios', description: 'Formula segura y tolerada, compatible con la mayoria de las dietas.' },
      { title: 'Garantia Total', description: 'Si no estas satisfecho, te devolvemos tu dinero sin preguntas.' },
    ]),
    testimonials: JSON.stringify([
      { name: 'Maria G.', location: 'Buenos Aires', text: 'Llevo 2 meses usandolo y los cambios son increibles. Mi energia cambio por completo y me siento mucho mejor conmigo misma.' },
      { name: 'Carlos R.', location: 'Cordoba', text: 'Lo recomiendo al 100%. Desde que empece a tomarlo note una mejora enorme en mi dia a dia. Espectacular producto.' },
      { name: 'Luciana M.', location: 'Rosario', text: 'Probe muchos productos antes pero ninguno me dio estos resultados. El envio fue rapido y la atencion al cliente excelente.' },
    ]),
    faq: JSON.stringify([
      { question: 'Como debo tomar el producto?', answer: 'Se recomienda seguir las instrucciones del envase. Generalmente, 1-2 capsulas diarias con agua, preferentemente con las comidas.' },
      { question: 'Es seguro para consumo prolongada?', answer: 'Si, todos los ingredientes son naturales y seguros para consumo prolongado. Consulta a tu medico si tenes alguna condicion preexistente.' },
      { question: 'Cuanto tarda en llegar el envio?', answer: 'Los envios se realizan dentro de las 24-48 horas habiles. El tiempo de entrega depende de tu ubicacion, generalmente entre 3-5 dias habiles.' },
      { question: 'Tienen garantia de devolucion?', answer: 'Si, ofrecemos garantia de satisfaccion. Si no estas conforme con el producto, podes solicitar la devolucion dentro de los 30 dias.' },
    ]),
    ctaText: 'Quiero Mi Oferta Ahora',
    urgencyText: 'Solo quedan 17 unidades - Oferta por tiempo limitado',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'ProductId es requerido' }, { status: 400 })
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const slug = slugify(`${product.name}-${Date.now()}`)
    const copyResult = buildFallbackCopy(product.name, product.description, product.price)

    // Create landing immediately — fast, no AI calls
    const landing = await db.landingPage.create({
      data: {
        slug,
        productId: product.id,
        productName: product.name,
        headline: copyResult.headline,
        subheadline: copyResult.subheadline,
        problem: copyResult.problem,
        solution: copyResult.solution,
        benefits: copyResult.benefits,
        testimonials: copyResult.testimonials,
        faq: copyResult.faq,
        ctaText: copyResult.ctaText,
        ctaLink: `/checkout/${product.id}?type=product`,
        heroImage1: product.image1 || null,
        heroImage2: product.image2 || null,
        urgencyText: copyResult.urgencyText,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      landing,
      slug: landing.slug,
    })
  } catch (error: any) {
    console.error('Error generating landing:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la landing' }, { status: 500 })
  }
}
