import { CONTACTO } from '../Pie/pieDatos.js'

/* El texto legal de Citaly: Términos y condiciones (con las normas de la
   comunidad y las de los negocios dentro) y Política de privacidad.

   Está escrito a partir de lo que la web hace HOY y de lo que ya está en el
   modelo de datos (docs/tablas-backend.md y las migraciones del backend):
   cuentas con correo o Google, reservas de mesa y de cita, locales de
   suscripción con socios y cuotas, opiniones, favoritos, avisos, el orden de
   Descubre, Taly y las fichas de los locales.

   ⚠️ Si cambia lo que se pide o a quién se le manda, se cambia aquí y se sube
   la fecha de ACTUALIZADO. Antes de abrir al público conviene que lo lea un
   abogado que conozca la ley cubana. */

export const ACTUALIZADO = '24 de noviembre de 2026'

const correo = CONTACTO.correo.replace(/^mailto:/, '')
const enlaceCorreo = <a href={CONTACTO.correo}>{correo}</a>

/* ------------------------------------------------------------------ */
/* Términos y condiciones                                              */
/* ------------------------------------------------------------------ */

export const TERMINOS = {
  id: 'terminos',
  titulo: 'Términos y condiciones',
  corto: 'Términos',
  intro: (
    <>
      <p>
        Bienvenido a Citaly. Estos términos son el acuerdo entre tú y Citaly cuando usas la web o la aplicación: explican qué
        hacemos, qué puedes esperar de nosotros y qué esperamos de ti. Incluyen también las normas de la comunidad y las
        normas para los negocios que se dan de alta.
      </p>
      <p>
        Los hemos escrito en un lenguaje sencillo a propósito. Léelos con calma: al crear tu cuenta, o al usar Citaly sin
        ella, aceptas lo que dicen.
      </p>
    </>
  ),
  secciones: [
    {
      id: 't-quienes',
      titulo: 'Quiénes somos y qué es Citaly',
      cuerpo: (
        <>
          <p>
            Citaly es una plataforma para descubrir locales de Cuba —restaurantes, cafeterías, bares, peluquerías,
            barberías, spas, gimnasios, academias y otros negocios— y reservar en ellos una mesa, una cita o una plaza.
            Tiene su base en {CONTACTO.ciudad}.
          </p>
          <p>
            Citaly <strong>no es el local</strong>. Somos el punto de encuentro entre quien busca y quien ofrece: ponemos la
            ficha, la agenda y los avisos, pero el servicio (la comida, el corte de pelo, la clase) lo presta cada negocio,
            que es el responsable de lo que ofrece, de sus precios y de cómo atiende.
          </p>
        </>
      ),
    },
    {
      id: 't-aceptacion',
      titulo: 'Aceptación de estos términos',
      cuerpo: (
        <>
          <p>
            Al registrarte, al entrar con Google o simplemente al navegar por Citaly, confirmas que has leído estos términos
            y la <a href="#privacidad">Política de privacidad</a>, y que estás de acuerdo con ellos. Si no lo estás, por
            favor no uses el servicio.
          </p>
          <p>
            Si das de alta un negocio, aceptas además las <a href="#t-negocios">Normas para negocios</a> de la sección 8.
          </p>
        </>
      ),
    },
    {
      id: 't-edad',
      titulo: 'Quién puede usar Citaly',
      cuerpo: (
        <>
          <p>
            Para tener una cuenta debes tener al menos <strong>16 años</strong>. Si tienes entre 16 y 18 años, necesitas el
            permiso de tu madre, padre o tutor, que será responsable del uso que hagas del servicio.
          </p>
          <p>
            Para dar de alta un negocio debes ser mayor de edad y tener capacidad legal para representarlo: ser su dueño o
            contar con su permiso expreso.
          </p>
        </>
      ),
    },
    {
      id: 't-cuenta',
      titulo: 'Tu cuenta',
      cuerpo: (
        <>
          <p>Puedes crear la cuenta con tu correo y una contraseña, o entrar directamente con tu cuenta de Google. En los dos casos:</p>
          <ul>
            <li>Los datos que nos des deben ser reales y tuyos. Una cuenta es de una sola persona.</li>
            <li>
              Te pediremos confirmar tu correo. Es la forma de asegurarnos de que es tuyo y de poder devolverte el acceso si
              olvidas la contraseña.
            </li>
            <li>
              Tu contraseña se guarda cifrada: nadie en Citaly puede verla. Aun así, eres responsable de no compartirla y de
              lo que se haga desde tu cuenta. Si sospechas que alguien entró sin permiso, cámbiala y escríbenos.
            </li>
            <li>
              Si entras con Google, Google nos confirma quién eres y nos pasa tu nombre, tu correo y tu foto. Nunca vemos tu
              contraseña de Google.
            </li>
          </ul>
          <p>
            Puedes borrar tu cuenta cuando quieras desde <strong>Mi Perfil</strong>. En la Política de privacidad te
            contamos qué pasa con tus datos al hacerlo.
          </p>
        </>
      ),
    },
    {
      id: 't-reservas',
      titulo: 'Reservas y citas',
      cuerpo: (
        <>
          <p>
            Reservar en Citaly es <strong>gratis</strong>. Eliges el local, el servicio, el día y la hora (y, si el local
            tiene mapa, la mesa; o el profesional que prefieras). A partir de ahí:
          </p>
          <ol>
            <li>
              <strong>La reserva queda pendiente</strong> hasta que el local la acepta. Mientras no la confirme, no está
              garantizada. Te avisaremos en la campana de Citaly cuando responda.
            </li>
            <li>
              <strong>El local puede aceptarla o rechazarla</strong>, por ejemplo si se llenó o si ese día cierra. También
              puede cancelarla más tarde si surge un imprevisto; en ese caso te avisaremos.
            </li>
            <li>
              <strong>Puedes cancelar</strong> desde Mis Citas. Hazlo con tiempo: ese hueco puede servirle a otra persona y
              al negocio.
            </li>
            <li>
              <strong>Si no te presentas</strong> sin cancelar, el local puede marcarlo. Si se repite a menudo, podremos
              limitar tu posibilidad de reservar.
            </li>
          </ol>
          <h4>Precios y pagos</h4>
          <p>
            Los precios, la duración de los servicios y condiciones como el consumo mínimo los pone cada local y se muestran
            en pesos cubanos (CUP) salvo que se indique otra cosa. Citaly los enseña tal como el local los publica, pero no
            puede garantizar que estén al día: el precio que vale es el que te cobre el local.
          </p>
          <p>
            <strong>Citaly no cobra pagos ni guarda dinero.</strong> Pagas directamente al local, en la forma que acordéis.
            Cualquier reclamación sobre el servicio, un cobro o una devolución se resuelve con el local; si no os entendéis,
            escríbenos y haremos lo que esté en nuestra mano para mediar.
          </p>
        </>
      ),
    },
    {
      id: 't-suscripciones',
      titulo: 'Locales de suscripción (gimnasios, cursos y similares)',
      cuerpo: (
        <>
          <p>
            Algunos negocios funcionan con planes o abonos: pagas una cuota cada semana, mes o periodo y tienes un turno o
            una plaza. En estos locales:
          </p>
          <ul>
            <li>Desde Citaly envías una solicitud para unirte a un plan y a un turno. No ocupa plaza hasta que el local la acepta.</li>
            <li>
              Las cuotas, los recargos por retraso, las fechas de cobro y las condiciones de baja las fija el local. Citaly
              solo le ayuda a llevar la cuenta de quién ha pagado y quién no.
            </li>
            <li>
              Los pagos se hacen al local, nunca a Citaly. Lo que el local anota en Citaly es un registro suyo, no un recibo
              emitido por nosotros.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 't-opiniones',
      titulo: 'Opiniones y normas de la comunidad',
      cuerpo: (
        <>
          <p>
            Las opiniones ayudan a los demás a elegir y a los negocios a mejorar. Por eso pedimos que sean honestas. Al
            publicar una opinión te comprometes a que:
          </p>
          <ul>
            <li>Hable de una experiencia tuya y real en ese local.</li>
            <li>No contenga insultos, amenazas, lenguaje discriminatorio ni contenido sexual.</li>
            <li>No incluya datos personales de nadie (teléfonos, direcciones, nombres completos de trabajadores…).</li>
            <li>No sea publicidad, spam, ni una opinión pagada o hecha a cambio de un descuento.</li>
            <li>Si tienes relación con el negocio (eres dueño, trabajas allí o compites con él), no lo valores.</li>
          </ul>
          <p>
            Tu opinión se publica con tu nombre y tu foto de perfil. En Mi Perfil puedes elegir que solo se vea tu nombre,
            sin apellido. El local puede leerla y responderla.
          </p>
          <p>
            Podemos ocultar o retirar opiniones que incumplan estas normas, y también las que un local denuncie si
            comprobamos que tiene razón. No retiramos opiniones solo porque sean negativas.
          </p>
        </>
      ),
    },
    {
      id: 't-negocios',
      titulo: 'Normas para negocios',
      cuerpo: (
        <>
          <p>Si das de alta un local en Citaly, además de todo lo anterior aceptas estas normas:</p>
          <ol>
            <li>
              <strong>El local es tuyo o tienes permiso.</strong> Declaras ser el dueño o tener autorización para llevarlo.
              Si alguien lo reclama, te pediremos que lo demuestres; mientras tanto podemos ocultar la ficha.
            </li>
            <li>
              <strong>Revisamos antes de publicar.</strong> Cada local nuevo pasa una revisión. Podemos pedirte más datos,
              sugerirte cambios o no aprobarlo si no cumple estas normas.
            </li>
            <li>
              <strong>Información real.</strong> Nombre, dirección, horarios, servicios y precios deben ser verdaderos y estar
              al día. Nada de precios gancho, servicios que no ofreces ni descripciones engañosas.
            </li>
            <li>
              <strong>Fotos propias o con permiso.</strong> Solo puedes subir fotos tuyas o que tengas derecho a usar, y
              deben mostrar de verdad tu local, tus productos o tu equipo.
            </li>
            <li>
              <strong>Respeta las reservas que aceptes.</strong> Si confirmas una cita, el cliente cuenta con ella. Si tienes
              que cancelarla, hazlo cuanto antes desde Citaly para que le llegue el aviso.
            </li>
            <li>
              <strong>Cuida los datos de tus clientes.</strong> Verás el nombre de quien reserva y los detalles de su cita (y
              su teléfono, si lo ha dado). Úsalos solo para atender esa reserva o esa suscripción: no los compartas, no los
              vendas y no los uses para enviar publicidad que no hayan pedido.
            </li>
            <li>
              <strong>Tu equipo.</strong> Puedes dar acceso a encargados y trabajadores. Eres responsable de lo que hagan desde
              el panel de tu negocio y de retirarles el acceso cuando dejen de trabajar contigo.
            </li>
            <li>
              <strong>Cumple la ley.</strong> Debes tener en regla las licencias y permisos que tu actividad necesite. La
              forma legal que indiques (trabajador por cuenta propia, mipyme, cooperativa…) solo la ve el equipo que revisa
              los locales; no se muestra a los clientes.
            </li>
          </ol>
          <p>
            Si un negocio incumple estas normas de forma grave o repetida, podemos ocultar su ficha, retirar opiniones
            falsas, suspender su panel o darlo de baja.
          </p>
        </>
      ),
    },
    {
      id: 't-descubre',
      titulo: 'Cómo ordenamos los locales en Descubre',
      cuerpo: (
        <>
          <p>
            Queremos que lo que ves sea útil, no que gane quien más paga. El orden de Descubre y de la búsqueda tiene en
            cuenta, entre otras cosas, la calidad del local (sus valoraciones y cuánta gente repite), si está abierto ahora,
            lo cerca que está de ti si nos has dado permiso para saberlo, lo que sueles buscar y si el local es nuevo. Además
            mezclamos un poco el orden para que todos los locales tengan su oportunidad.
          </p>
          <p>
            En el futuro algunos negocios podrán pagar por aparecer en un hueco destacado. Esos huecos irán siempre{' '}
            <strong>marcados como patrocinados</strong> y no cambian la puntuación del resto de locales.
          </p>
        </>
      ),
    },
    {
      id: 't-taly',
      titulo: 'Taly, el asistente',
      cuerpo: (
        <>
          <p>
            Taly te ayuda a encontrar sitios y a preparar reservas conversando. Sus respuestas se generan de forma automática
            y, aunque intentamos que sean correctas, <strong>puede equivocarse</strong>: revisa siempre el local, el día y la
            hora antes de confirmar una reserva hecha con su ayuda.
          </p>
          <p>
            No le cuentes a Taly datos sensibles que no hagan falta para tu reserva (sobre tu salud, tu dinero o tus
            contraseñas, por ejemplo).
          </p>
        </>
      ),
    },
    {
      id: 't-prohibido',
      titulo: 'Lo que no está permitido',
      cuerpo: (
        <>
          <p>Para que Citaly funcione bien para todos, no está permitido:</p>
          <ul>
            <li>Hacer reservas falsas o en masa para bloquear la agenda de un local.</li>
            <li>Hacerte pasar por otra persona o por otro negocio.</li>
            <li>Publicar contenido ilegal, ofensivo, engañoso o que infrinja derechos de otros.</li>
            <li>Intentar acceder a cuentas, datos o partes del sistema que no son tuyas.</li>
            <li>Usar programas automáticos para copiar el contenido de Citaly o sobrecargar el servicio.</li>
            <li>Usar Citaly para enviar publicidad no deseada o para cualquier fin distinto al que está pensado.</li>
          </ul>
        </>
      ),
    },
    {
      id: 't-contenido',
      titulo: 'Propiedad intelectual y tu contenido',
      cuerpo: (
        <>
          <p>
            El nombre Citaly, su logotipo, Taly y sus ilustraciones, el diseño de la web y su código nos pertenecen. No
            puedes copiarlos ni usarlos sin nuestro permiso.
          </p>
          <p>
            Lo que tú subes —opiniones, fotos, la ficha de tu local— sigue siendo tuyo. Al publicarlo nos das permiso, gratis
            y mientras esté publicado, para mostrarlo dentro de Citaly y para compartir enlaces a él (por ejemplo, el cartel
            o el código QR de tu local). Si lo borras, dejamos de mostrarlo.
          </p>
        </>
      ),
    },
    {
      id: 't-disponibilidad',
      titulo: 'Disponibilidad del servicio',
      cuerpo: (
        <p>
          Citaly está en crecimiento y lo mejoramos constantemente. Hacemos lo posible para que funcione siempre, pero puede
          haber cortes, fallos de conexión o momentos de mantenimiento. Podemos añadir, cambiar o retirar funciones; si un
          cambio te afecta de forma importante, te avisaremos con antelación.
        </p>
      ),
    },
    {
      id: 't-responsabilidad',
      titulo: 'Responsabilidad',
      cuerpo: (
        <>
          <p>
            Citaly pone en contacto a clientes y negocios, pero no presta los servicios de los locales ni participa en los
            pagos. Por eso no somos responsables de la calidad de lo que ofrece un local, de que cumpla sus horarios o
            precios, ni de lo que pase dentro de él.
          </p>
          <p>
            Tampoco respondemos de los daños causados por cortes del servicio que no dependan de nosotros, por un uso indebido
            de tu cuenta o por la información que publiquen otros usuarios. Nada de esto limita los derechos que la ley te
            reconozca y que no puedan excluirse.
          </p>
        </>
      ),
    },
    {
      id: 't-baja',
      titulo: 'Suspensión y baja',
      cuerpo: (
        <p>
          Puedes dejar de usar Citaly y borrar tu cuenta cuando quieras. Por nuestra parte, podemos suspender o cerrar una
          cuenta o un local que incumpla estos términos, que ponga en riesgo a otras personas o que use el servicio de forma
          fraudulenta. Salvo en casos graves o urgentes, te avisaremos antes y te explicaremos el motivo.
        </p>
      ),
    },
    {
      id: 't-cambios',
      titulo: 'Cambios en estos términos',
      cuerpo: (
        <p>
          Podemos actualizar estos términos cuando cambie el servicio o la ley. La fecha de arriba indica la última versión.
          Si el cambio es importante, te lo diremos dentro de Citaly antes de que entre en vigor. Si sigues usando el servicio
          después, entenderemos que lo aceptas.
        </p>
      ),
    },
    {
      id: 't-ley',
      titulo: 'Ley aplicable',
      cuerpo: (
        <p>
          Estos términos se rigen por las leyes de la República de Cuba. Antes de acudir a cualquier otra vía, te pedimos que
          nos escribas: la mayoría de los problemas se resuelven hablando.
        </p>
      ),
    },
    {
      id: 't-contacto',
      titulo: 'Contacto',
      cuerpo: (
        <p>
          Para cualquier duda sobre estos términos escríbenos a {enlaceCorreo}, o desde la sección de Ayuda de la propia web.
        </p>
      ),
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Política de privacidad                                              */
/* ------------------------------------------------------------------ */

export const PRIVACIDAD = {
  id: 'privacidad',
  titulo: 'Política de privacidad',
  corto: 'Privacidad',
  intro: (
    <>
      <p>
        Para reservarte una mesa o una cita necesitamos saber algunas cosas de ti. Aquí te contamos cuáles, para qué las
        usamos, con quién las compartimos y qué puedes hacer con ellas.
      </p>
      <p>
        La idea de fondo es sencilla: <strong>pedimos solo lo necesario, no vendemos tus datos</strong> y puedes borrarlos
        cuando quieras. Tratamos tus datos conforme a la legislación cubana de protección de datos personales (Ley 149 de
        2022) y a las buenas prácticas internacionales.
      </p>
    </>
  ),
  secciones: [
    {
      id: 'p-responsable',
      titulo: 'Quién es el responsable',
      cuerpo: (
        <p>
          El responsable de tus datos es Citaly, con base en {CONTACTO.ciudad}. Para cualquier cosa relacionada con tu
          privacidad puedes escribirnos a {enlaceCorreo}.
        </p>
      ),
    },
    {
      id: 'p-datos',
      titulo: 'Qué datos recogemos',
      cuerpo: (
        <>
          <h4>Cuando creas tu cuenta</h4>
          <ul>
            <li>Tu nombre y tu correo electrónico.</li>
            <li>Tu contraseña, que se guarda cifrada y nadie puede leer.</li>
            <li>Tu foto de perfil, si decides poner una.</li>
            <li>Si entras con Google: el nombre, el correo y la foto de tu cuenta de Google, y el identificador que Google nos da para reconocerte.</li>
          </ul>

          <h4>Para mantener tu sesión segura</h4>
          <ul>
            <li>
              La dirección IP y el tipo de navegador o dispositivo desde los que entras, junto con la fecha. Nos sirven para
              mantenerte dentro, cerrar sesiones antiguas y detectar accesos extraños.
            </li>
          </ul>

          <h4>Cuando usas Citaly</h4>
          <ul>
            <li>
              <strong>Reservas:</strong> el local, el día y la hora, los servicios elegidos y su precio, la mesa o el
              profesional, cuántas personas venís, las notas que escribas para el local, el estado de la reserva y si
              asististe.
            </li>
            <li>
              <strong>Suscripciones:</strong> el plan y el turno al que te unes y los pagos que el local anote (fecha, importe
              y recargos).
            </li>
            <li>
              <strong>Opiniones:</strong> la puntuación, el texto y la fecha.
            </li>
            <li>
              <strong>Tus preferencias:</strong> tema claro u oscuro, cuándo quieres el recordatorio de tus citas, si quieres
              avisos por WhatsApp y si prefieres que en tus opiniones salga solo tu nombre.
            </li>
            <li>
              <strong>Favoritos, avisos y notificaciones:</strong> los locales que guardas, los que te interesa saber cuándo
              abren y los avisos que te enviamos.
            </li>
            <li>
              <strong>Uso de Descubre:</strong> qué locales te mostramos, cuáles abres o reservas y qué categorías filtras.
              Si no tienes cuenta, esto se asocia a un identificador aleatorio de tu navegador, no a ti.
            </li>
            <li>
              <strong>Mensajes:</strong> lo que nos escribas desde Ayuda u Opinión, y tus conversaciones con Taly.
            </li>
            <li>
              <strong>Teléfono:</strong> solo si nos lo das, para que el local pueda contactarte por tu reserva o para los
              avisos por WhatsApp.
            </li>
          </ul>

          <h4>Si das de alta un negocio</h4>
          <ul>
            <li>
              Los datos del local: nombre, tipo, categoría, dirección (provincia, municipio, calle, entre calles y
              referencias), su punto en el mapa, WhatsApp, teléfono fijo, correo de contacto, horarios, servicios, precios,
              fotos, plano de mesas y la forma legal del negocio.
            </li>
            <li>El nombre y la foto de los profesionales que añadas, y las personas de tu equipo con acceso al panel.</li>
            <li>
              Los datos de tus socios en los locales de suscripción (nombre, teléfono, plan, turno y pagos) que anotes tú.
            </li>
          </ul>
          <p>
            La ficha del local es <strong>pública</strong>: cualquiera puede ver el nombre, la dirección, los horarios, los
            precios, las fotos y los teléfonos de contacto. La forma legal solo la ve el equipo de revisión.
          </p>

          <h4>Tu ubicación</h4>
          <p>
            Solo te la pedimos si tocas el botón para ver lo que tienes cerca. Se usa para calcular distancias,{' '}
            <strong>se queda guardada en tu propio dispositivo, caduca a las 3 horas y nunca se envía a nuestros
            servidores</strong>. Puedes negar o retirar el permiso desde tu navegador.
          </p>

          <h4>Lo que no te pedimos</h4>
          <p>
            No te pedimos carné de identidad, datos bancarios ni de tarjetas, ni datos sobre tu salud, religión u opiniones
            políticas. Si alguna vez una función nueva necesitara algún dato más, lo añadiremos aquí antes de pedirlo.
          </p>
        </>
      ),
    },
    {
      id: 'p-para-que',
      titulo: 'Para qué los usamos',
      cuerpo: (
        <>
          <ul>
            <li>
              <strong>Darte el servicio:</strong> crear y gestionar tu cuenta, enviar tus reservas al local, enseñarte tus
              citas y recordártelas.
            </li>
            <li>
              <strong>Avisarte:</strong> cuando un local confirma o cancela, cuando se acerca tu cita o cuando abre un sitio
              que te interesa. Y enviarte por correo lo imprescindible: confirmar tu dirección o recuperar tu contraseña.
            </li>
            <li>
              <strong>Mejorar Descubre:</strong> ordenar los locales de forma más útil para ti y saber, en conjunto, qué
              locales se ven y se visitan.
            </li>
            <li>
              <strong>Cuidar la comunidad:</strong> revisar los locales nuevos, moderar opiniones y prevenir abusos y
              fraudes.
            </li>
            <li>
              <strong>Atenderte:</strong> responder tus preguntas, ideas y quejas.
            </li>
            <li>
              <strong>Cumplir la ley</strong> cuando una autoridad competente nos lo pida.
            </li>
          </ul>
          <p>
            Usamos tus datos porque son necesarios para darte el servicio que pides, porque tenemos un interés legítimo en
            que Citaly sea seguro y útil, o porque tú nos das tu consentimiento (como con la ubicación). Lo que se basa en tu
            consentimiento lo puedes retirar cuando quieras.
          </p>
          <p>
            <strong>No vendemos tus datos ni los usamos para publicidad de terceros.</strong>
          </p>
        </>
      ),
    },
    {
      id: 'p-quien-ve',
      titulo: 'Quién puede ver tus datos',
      cuerpo: (
        <>
          <ul>
            <li>
              <strong>El local donde reservas</strong> (y su equipo): tu nombre, tu foto, los detalles de tu reserva y tu
              teléfono si lo diste. Si te unes a un plan, también tu turno y tus pagos.
            </li>
            <li>
              <strong>Todo el mundo:</strong> tus opiniones, con tu nombre (o solo el nombre de pila, si lo eliges) y tu foto.
            </li>
            <li>
              <strong>Los servicios que nos ayudan a funcionar</strong>, que solo tratan los datos por encargo nuestro: el
              alojamiento de la web y del servidor, la base de datos (Neon), el almacenamiento de imágenes (Cloudinary), el
              servicio que envía nuestros correos, Google si eliges entrar con él, y el servicio de inteligencia artificial
              que da las respuestas de Taly.
            </li>
            <li>
              <strong>Las autoridades</strong>, solo cuando la ley nos obligue.
            </li>
          </ul>
          <p>
            Algunos de estos servicios tienen sus servidores fuera de Cuba. Elegimos proveedores que protegen los datos con
            medidas de seguridad reconocidas y que no pueden usarlos para fines propios.
          </p>
        </>
      ),
    },
    {
      id: 'p-dispositivo',
      titulo: 'Lo que se guarda en tu dispositivo',
      cuerpo: (
        <>
          <p>
            Citaly guarda algunas cosas en tu navegador para funcionar más rápido y aunque la conexión falle: la cookie que te
            mantiene con la sesión iniciada, el tema que elegiste, tu ubicación aproximada (3 horas como máximo), los avisos de
            apertura, el identificador anónimo de Descubre y algún borrador que dejes a medias.
          </p>
          <p>
            <strong>No usamos cookies de publicidad ni de seguimiento de terceros.</strong> Puedes borrar todo esto cuando
            quieras desde los ajustes de tu navegador; solo tendrás que volver a iniciar sesión.
          </p>
        </>
      ),
    },
    {
      id: 'p-tiempo',
      titulo: 'Cuánto tiempo los guardamos',
      cuerpo: (
        <>
          <p>Guardamos tus datos mientras tengas la cuenta. Cuando la borras:</p>
          <ul>
            <li>Eliminamos tu perfil, tu foto, tus favoritos, tus preferencias, tus notificaciones y tus sesiones.</li>
            <li>Tus opiniones se quedan publicadas, pero sin tu nombre ni tu foto.</li>
            <li>
              El registro de las citas pasadas puede conservarse sin datos que te identifiquen, porque forma parte de la
              agenda y de las cuentas del local.
            </li>
            <li>Las estadísticas de Descubre se quedan desvinculadas de ti.</li>
          </ul>
          <p>
            Los enlaces que te enviamos por correo (para confirmar tu dirección o cambiar la contraseña) caducan a las pocas
            horas. Las copias de seguridad se renuevan y borran solas con el tiempo.
          </p>
        </>
      ),
    },
    {
      id: 'p-seguridad',
      titulo: 'Cómo los protegemos',
      cuerpo: (
        <p>
          Las conexiones con Citaly van cifradas (HTTPS), las contraseñas se guardan con un cifrado que no se puede deshacer
          y solo el personal que lo necesita puede acceder a los datos. Ningún sistema es infalible: si alguna vez ocurriera
          un problema de seguridad que afectara a tus datos, te lo diríamos lo antes posible y te explicaríamos qué hacer.
        </p>
      ),
    },
    {
      id: 'p-derechos',
      titulo: 'Tus derechos',
      cuerpo: (
        <>
          <p>Sobre tus datos personales puedes, en cualquier momento:</p>
          <ul>
            <li><strong>Saber</strong> qué datos tuyos tenemos y pedirnos una copia.</li>
            <li><strong>Corregirlos</strong> si están mal o incompletos. Muchos los cambias tú mismo en Mi Perfil.</li>
            <li><strong>Borrarlos</strong>, eliminando tu cuenta desde Mi Perfil o pidiéndonoslo.</li>
            <li><strong>Oponerte</strong> a algún uso concreto o pedirnos que lo limitemos.</li>
            <li>
              <strong>Retirar tu consentimiento</strong>, por ejemplo el de la ubicación o el de los avisos, desde tu
              navegador o desde Mi Perfil.
            </li>
          </ul>
          <p>
            Escríbenos a {enlaceCorreo} desde el correo de tu cuenta. Te responderemos en un plazo máximo de 30 días. Si crees
            que no hemos atendido bien tu petición, puedes acudir a la autoridad competente en protección de datos.
          </p>
        </>
      ),
    },
    {
      id: 'p-menores',
      titulo: 'Menores de edad',
      cuerpo: (
        <p>
          Citaly no está pensado para menores de 16 años y no recogemos sus datos a sabiendas. Si eres madre, padre o tutor y
          crees que un menor nos ha dado sus datos, escríbenos y los borraremos.
        </p>
      ),
    },
    {
      id: 'p-cambios',
      titulo: 'Cambios en esta política',
      cuerpo: (
        <p>
          Si cambiamos qué datos pedimos o cómo los usamos, actualizaremos esta página y la fecha de arriba. Si el cambio es
          importante, te avisaremos dentro de Citaly antes de que se aplique.
        </p>
      ),
    },
  ],
}

export const DOCUMENTOS = [TERMINOS, PRIVACIDAD]
