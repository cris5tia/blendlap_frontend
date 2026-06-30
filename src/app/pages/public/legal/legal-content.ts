export interface ISeccionLegal {
  titulo: string;
  parrafos?: string[];
  lista?: string[];
  nota?: string;
}

export interface IContenidoLegal {
  tipo: string;
  etiqueta: string;
  titulo: string;
  resumen: string;
  secciones: ISeccionLegal[];
}

export const FECHA_ACTUALIZACION = '15 de junio de 2026';

export const ORDEN_LEGAL = ['terminos', 'privacidad', 'datos', 'derechos', 'cambios'];

export const CONTENIDO_LEGAL: Record<string, IContenidoLegal> = {

  // ─────────────────────────────────────────────────────────
  terminos: {
    tipo: 'terminos',
    etiqueta: 'Legal',
    titulo: 'Términos y Condiciones',
    resumen: 'Al registrarte, agendar una cita o comprar en Blendlap aceptas estas condiciones. Resumen: trátanos con respeto, los precios y el stock pueden cambiar, los productos se retiran en tienda y los créditos a plazo requieren un teléfono válido y aprobación previa.',
    secciones: [
      {
        titulo: '1. Aceptación de los términos',
        parrafos: [
          'Estos Términos y Condiciones regulan el acceso y uso de la plataforma de Blendlap Barbería ("Blendlap", "nosotros"), incluyendo el sitio web, la reserva de citas, la tienda en línea y el sistema de créditos a plazo.',
          'Al crear una cuenta, agendar un servicio o realizar una compra, confirmas que has leído, entendido y aceptado este documento. Si no estás de acuerdo, te pedimos no utilizar la plataforma.'
        ]
      },
      {
        titulo: '2. Quiénes somos',
        parrafos: [
          'Blendlap es una barbería ubicada en Cl. 48 # 19-55, Armenia, Quindío, especializada en cortes de cabello, arreglo de barba, tintes y otros servicios de estética masculina, y que además comercializa productos de cuidado personal (lociones, perfumes, gorras, ropa y accesorios) a través de su tienda en línea.'
        ]
      },
      {
        titulo: '3. Registro y cuenta de usuario',
        parrafos: [
          'Algunas funciones requieren crear una cuenta con correo electrónico y contraseña, o mediante inicio de sesión con Google. Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.'
        ],
        lista: [
          'La información registrada (nombre, teléfono, correo) debe ser veraz y mantenerse actualizada.',
          'Cada cuenta es personal e intransferible.',
          'Puedes solicitar la actualización o eliminación de tu cuenta en cualquier momento desde tu perfil o contactándonos.'
        ]
      },
      {
        titulo: '4. Reserva de citas',
        lista: [
          'Las citas están sujetas a la disponibilidad de los barberos y a los horarios de atención (martes a domingo, 9:00 a.m. – 9:00 p.m.).',
          'La cita queda confirmada únicamente cuando el sistema la registra como tal; recibirás la confirmación en la plataforma.',
          'Puedes cancelar o reprogramar tu cita con anticipación desde tu perfil.',
          'La inasistencia reiterada sin aviso previo podrá limitar la posibilidad de agendar futuras citas.'
        ]
      },
      {
        titulo: '5. Compra de productos',
        parrafos: [
          'Los productos publicados están sujetos a disponibilidad de inventario; el stock puede agotarse o ajustarse sin previo aviso. Los precios pueden ser modificados en cualquier momento, sin que esto afecte compras ya confirmadas.',
          'Todas las compras —pagadas en línea o a través de crédito a plazo— deben reclamarse directamente en las instalaciones de Blendlap, ya que actualmente no se realizan entregas a domicilio.'
        ]
      },
      {
        titulo: '6. Pagos y pasarela de pago',
        parrafos: [
          'Los pagos en línea se procesan a través de Wompi, una pasarela de pagos certificada. Blendlap no almacena los datos completos de tu tarjeta; esa información es gestionada directamente por el proveedor de pagos bajo sus propios estándares de seguridad.',
          'Toda transacción está sujeta a un proceso de validación. Blendlap podrá cancelar un pedido si existen inconsistencias en la información suministrada o si no es posible confirmar el pago.'
        ]
      },
      {
        titulo: '7. Créditos a plazo (fiado)',
        parrafos: [
          'Blendlap ofrece la posibilidad de adquirir productos mediante crédito a plazo (1 semana, 1 quincena, 2 quincenas o 1 mes), sujeto a la aprobación de un administrador.'
        ],
        lista: [
          'Para solicitar un crédito es obligatorio contar con un número de teléfono válido registrado en tu perfil; esto nos permite confirmar la solicitud y hacer seguimiento al pago.',
          'La solicitud queda en estado "pendiente" hasta que un administrador la revisa y la aprueba o la rechaza.',
          'Al aprobarse el crédito, el stock de los productos solicitados se descuenta y el saldo queda pendiente de pago dentro del plazo elegido.',
          'El incumplimiento reiterado del pago podrá afectar la posibilidad de acceder a créditos futuros.'
        ]
      },
      {
        titulo: '8. Propiedad intelectual',
        parrafos: [
          'El logotipo, los textos, las imágenes, el diseño y demás contenidos del sitio son propiedad de Blendlap o se usan con la debida autorización. Queda prohibida su reproducción o uso comercial sin autorización previa y expresa.'
        ]
      },
      {
        titulo: '9. Uso adecuado de la plataforma',
        parrafos: [
          'Te comprometes a usar la plataforma de forma responsable: no intentar vulnerar su seguridad, no suplantar a otros usuarios y no realizar acciones que afecten su funcionamiento o perjudiquen a otros clientes o al equipo de Blendlap.'
        ]
      },
      {
        titulo: '10. Limitación de responsabilidad',
        parrafos: [
          'Blendlap no será responsable por fallas ajenas a su control directo, como interrupciones de internet, fallas de la pasarela de pago o eventos de fuerza mayor. Trabajamos para mantener la plataforma disponible y corregir cualquier inconveniente lo antes posible.'
        ]
      },
      {
        titulo: '11. Ley aplicable',
        parrafos: [
          'Estos términos se rigen por la legislación de la República de Colombia, incluyendo la Ley 1480 de 2011 (Estatuto del Consumidor) en lo que corresponda a las relaciones de consumo derivadas del uso de esta plataforma.'
        ]
      },
      {
        titulo: '12. Modificaciones',
        parrafos: [
          `Blendlap podrá actualizar estos Términos y Condiciones cuando sea necesario para mejorar el servicio o adaptarse a cambios normativos. La fecha de la última actualización siempre estará visible al inicio de este documento.`
        ]
      },
      {
        titulo: '13. Contacto',
        parrafos: [
          'Para dudas relacionadas con estos términos puedes escribirnos a info@blendlap.com, por WhatsApp al +57 321 895 4895, o visitarnos en Cl. 48 # 19-55, Armenia, Quindío.'
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  privacidad: {
    tipo: 'privacidad',
    etiqueta: 'Legal',
    titulo: 'Política de Privacidad',
    resumen: 'Recopilamos solo la información necesaria para agendar tus citas, procesar tus compras y mejorar tu experiencia. No vendemos tus datos a terceros y puedes solicitar conocerlos, corregirlos o eliminarlos cuando quieras.',
    secciones: [
      {
        titulo: '1. Información general',
        parrafos: [
          'En Blendlap respetamos tu privacidad. Esta política explica qué información recopilamos a través del sitio web, con qué finalidad la usamos y cómo la protegemos.'
        ]
      },
      {
        titulo: '2. Información que recopilamos',
        lista: [
          'Datos de registro: nombre, apellido, correo electrónico, teléfono y, opcionalmente, foto de perfil.',
          'Datos de autenticación: si usas Google para iniciar sesión, recibimos tu nombre y correo asociado a esa cuenta.',
          'Información de citas: servicios solicitados, barbero elegido, fecha y hora.',
          'Historial de compras y créditos: productos adquiridos, montos, plazos y estado de pago.',
          'Información técnica básica del dispositivo y navegador, para mantener la plataforma funcionando correctamente.'
        ]
      },
      {
        titulo: '3. Cómo usamos tu información',
        lista: [
          'Gestionar tu registro y mantener tu sesión activa.',
          'Programar, confirmar y recordarte tus citas.',
          'Procesar tus compras y solicitudes de crédito a plazo.',
          'Enviarte notificaciones relevantes sobre tus reservas, compras o créditos.',
          'Brindarte atención al cliente y resolver inquietudes.',
          'Mejorar continuamente la plataforma y prevenir usos fraudulentos.'
        ]
      },
      {
        titulo: '4. Conservación de los datos',
        parrafos: [
          'Conservamos tu información mientras mantengas una cuenta activa o mientras sea necesario para cumplir las finalidades descritas, incluyendo obligaciones legales o contables. Puedes solicitar la eliminación de tus datos en cualquier momento, salvo la información que debamos conservar por ley.'
        ]
      },
      {
        titulo: '5. Seguridad de la información',
        parrafos: [
          'Implementamos medidas razonables de seguridad —como contraseñas cifradas y comunicación segura— para prevenir el acceso no autorizado, la pérdida o el uso indebido de tu información.'
        ]
      },
      {
        titulo: '6. Proveedores y terceros',
        parrafos: [
          'Para operar la plataforma trabajamos con proveedores externos que procesan ciertos datos en nuestro nombre, bajo sus propias políticas de seguridad:'
        ],
        lista: [
          'Wompi: procesamiento de pagos en línea.',
          'Google: inicio de sesión opcional (OAuth).',
          'Cloudinary: almacenamiento de imágenes de productos y perfiles.',
          'Proveedor de correo electrónico: envío de notificaciones transaccionales (confirmaciones, recuperación de contraseña, etc.).'
        ],
        nota: 'Blendlap no vende ni alquila tu información personal a terceros con fines comerciales.'
      },
      {
        titulo: '7. Tus derechos',
        parrafos: [
          'Como titular de tus datos personales tienes derecho a conocerlos, actualizarlos, rectificarlos y solicitar su eliminación. Encuentras el detalle completo en nuestra Política de Tratamiento de Datos Personales y en la página de Derechos del Usuario.'
        ]
      },
      {
        titulo: '8. Menores de edad',
        parrafos: [
          'Nuestros servicios están dirigidos a personas mayores de edad. Si un menor de edad utiliza la plataforma, debe hacerlo bajo la supervisión y autorización de su acudiente.'
        ]
      },
      {
        titulo: '9. Cambios a esta política',
        parrafos: [
          'Podremos actualizar esta Política de Privacidad para reflejar mejoras en nuestros procesos o cambios normativos. Cualquier cambio relevante se publicará en esta misma página con su fecha de actualización.'
        ]
      },
      {
        titulo: '10. Contacto',
        parrafos: [
          'Para consultas sobre esta política escríbenos a info@blendlap.com o por WhatsApp al +57 321 895 4895.'
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  datos: {
    tipo: 'datos',
    etiqueta: 'Legal · Habeas Data',
    titulo: 'Tratamiento de Datos Personales',
    resumen: 'Documento exigido por la Ley 1581 de 2012 (Habeas Data). Explica quién trata tus datos, para qué, y cómo puedes ejercer tus derechos de acceso, actualización, rectificación y eliminación (derechos ARCO).',
    secciones: [
      {
        titulo: '1. Responsable del tratamiento',
        parrafos: [
          'Blendlap Barbería, con domicilio en Cl. 48 # 19-55, Armenia, Quindío, Colombia, es responsable del tratamiento de los datos personales que recopila a través de su plataforma.'
        ]
      },
      {
        titulo: '2. Marco legal',
        parrafos: [
          'Esta política se establece en cumplimiento del artículo 15 de la Constitución Política de Colombia, la Ley 1581 de 2012 y el Decreto 1377 de 2013, normas que regulan la protección de datos personales (Habeas Data) en Colombia.'
        ]
      },
      {
        titulo: '3. Datos que se tratan',
        lista: [
          'Datos de identificación: nombre, apellido, correo electrónico, teléfono.',
          'Datos de transacciones: compras, créditos a plazo, citas agendadas.',
          'Datos de imagen (opcionales): foto de perfil.'
        ],
        nota: 'Blendlap no recopila datos sensibles (salud, orientación sexual, creencias religiosas o políticas, entre otros) a través de su plataforma.'
      },
      {
        titulo: '4. Finalidades del tratamiento',
        lista: [
          'Gestionar el registro, la autenticación y el perfil de cada usuario.',
          'Programar y confirmar citas, y enviar recordatorios.',
          'Procesar compras, pagos y solicitudes de crédito a plazo.',
          'Contactar al titular para confirmar pedidos, créditos o resolver inquietudes.',
          'Cumplir obligaciones legales, contables y de reporte cuando aplique.'
        ]
      },
      {
        titulo: '5. Autorización del titular',
        parrafos: [
          'Al registrarte en la plataforma, agendar una cita o realizar una compra, otorgas tu autorización previa, expresa e informada para que Blendlap trate tus datos personales conforme a las finalidades aquí descritas.'
        ]
      },
      {
        titulo: '6. Derechos del titular (Derechos ARCO)',
        lista: [
          'Acceder y conocer los datos personales que Blendlap tiene almacenados sobre ti.',
          'Actualizar y rectificar tu información cuando esté incompleta o sea inexacta.',
          'Solicitar la supresión (eliminación) de tus datos cuando no exista un deber legal de conservarlos.',
          'Revocar la autorización otorgada para el tratamiento de tus datos.',
          'Presentar consultas y reclamos ante Blendlap o, en última instancia, ante la Superintendencia de Industria y Comercio.'
        ]
      },
      {
        titulo: '7. Cómo ejercer tus derechos',
        parrafos: [
          'Puedes ejercer cualquiera de estos derechos escribiendo a info@blendlap.com, por WhatsApp al +57 321 895 4895, o presencialmente en Cl. 48 # 19-55, Armenia, Quindío.'
        ],
        lista: [
          'Consultas: se atienden dentro de los 10 días hábiles siguientes a la solicitud.',
          'Reclamos: se resuelven dentro de los 15 días hábiles siguientes a la solicitud. Si se requiere más tiempo, te informaremos los motivos antes de que venza ese plazo.'
        ]
      },
      {
        titulo: '8. Transferencia de datos',
        parrafos: [
          'Tus datos solo se comparten con los proveedores estrictamente necesarios para operar la plataforma (pasarela de pagos, almacenamiento de imágenes, envío de correos), quienes están obligados a tratarlos de forma confidencial y exclusivamente para prestar dicho servicio.'
        ]
      },
      {
        titulo: '9. Vigencia',
        parrafos: [
          'Esta política rige desde su publicación y permanecerá vigente mientras Blendlap trate datos personales de sus usuarios, sin perjuicio de las actualizaciones que se realicen.'
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  derechos: {
    tipo: 'derechos',
    etiqueta: 'Legal',
    titulo: 'Derechos del Usuario',
    resumen: 'Como cliente de Blendlap tienes derechos como titular de datos personales y como consumidor. Aquí explicamos ambos, en qué consisten y cómo ejercerlos.',
    secciones: [
      {
        titulo: '1. Derechos como titular de datos personales',
        parrafos: [
          'En virtud de la Ley 1581 de 2012, tienes derecho a conocer, actualizar, rectificar y solicitar la eliminación de tus datos personales, así como a revocar la autorización que nos hayas otorgado. El detalle completo de estos derechos y el procedimiento para ejercerlos está disponible en nuestra Política de Tratamiento de Datos Personales.'
        ]
      },
      {
        titulo: '2. Derechos como consumidor',
        parrafos: [
          'De acuerdo con la Ley 1480 de 2011 (Estatuto del Consumidor), como cliente de Blendlap tienes derecho a:'
        ],
        lista: [
          'Recibir información clara, veraz y suficiente sobre los productos y servicios antes de adquirirlos.',
          'Recibir productos en buen estado y que correspondan a lo ofrecido.',
          'Reclamar por garantía cuando un producto presente fallas de fabricación.',
          'Presentar quejas y reclamos, y recibir una respuesta oportuna.',
          'No ser discriminado en la atención del servicio.'
        ]
      },
      {
        titulo: '3. Garantía legal de los productos',
        parrafos: [
          'Todos los productos vendidos por Blendlap cuentan con garantía legal frente a defectos de fabricación, independientemente de cualquier garantía comercial adicional. El procedimiento para solicitarla está detallado en nuestra página de Cambios y Devoluciones.'
        ]
      },
      {
        titulo: '4. Peticiones, quejas y reclamos (PQRS)',
        parrafos: [
          'Puedes presentar cualquier petición, queja o reclamo relacionado con tu cuenta, una cita, una compra o un crédito a plazo a través de los siguientes canales:'
        ],
        lista: [
          'WhatsApp: +57 321 895 4895',
          'Correo electrónico: info@blendlap.com',
          'Presencialmente: Cl. 48 # 19-55, Armenia, Quindío'
        ]
      },
      {
        titulo: '5. Tiempos de respuesta',
        lista: [
          'Peticiones y consultas generales: hasta 10 días hábiles.',
          'Reclamos relacionados con productos, créditos o tratamiento de datos: hasta 15 días hábiles.'
        ]
      },
      {
        titulo: '6. Instancias adicionales',
        parrafos: [
          'Si consideras que tu solicitud no fue atendida adecuadamente, puedes acudir a la Superintendencia de Industria y Comercio (SIC), entidad encargada de la protección al consumidor y de los datos personales en Colombia.'
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  cambios: {
    tipo: 'cambios',
    etiqueta: 'Legal',
    titulo: 'Cambios y Devoluciones',
    resumen: 'Tienes 5 días calendario desde la compra para solicitar un cambio o devolución, presentando tu comprobante y con el producto sin usar. Los productos con fallas de fabricación tienen garantía legal sin límite de tiempo de uso normal.',
    secciones: [
      {
        titulo: '1. Alcance',
        parrafos: [
          'Esta política aplica únicamente a los productos físicos vendidos por Blendlap (lociones, perfumes, ropa, accesorios, entre otros), ya sea pagados en línea o mediante crédito a plazo. No aplica a servicios de barbería ya prestados (cortes, arreglo de barba, tintes u otros tratamientos).'
        ]
      },
      {
        titulo: '2. Condiciones para cambios y devoluciones',
        lista: [
          'Presentar la factura, el comprobante de compra o el historial de tu cuenta.',
          'El producto debe estar en buen estado, sin uso ni alteraciones.',
          'La solicitud debe realizarse dentro de los 5 días calendario siguientes a la compra o al retiro del producto en tienda.',
          'El empaque original debe conservarse cuando aplique.'
        ]
      },
      {
        titulo: '3. Garantía por fallas de fabricación',
        parrafos: [
          'Si el producto presenta una falla de fabricación, aplica la garantía legal establecida por la Ley 1480 de 2011, independientemente de si han pasado los 5 días del punto anterior. En estos casos, Blendlap evaluará el producto y ofrecerá su reparación, cambio o reembolso, según corresponda.'
        ]
      },
      {
        titulo: '4. Cómo solicitar un cambio o devolución',
        lista: [
          'Escríbenos por WhatsApp al +57 321 895 4895 o al correo info@blendlap.com indicando el producto y el motivo.',
          'Acércate a Cl. 48 # 19-55, Armenia, Quindío con el producto y tu comprobante de compra.',
          'Nuestro equipo revisará el producto y te confirmará si procede el cambio, la devolución o la reparación en garantía.'
        ]
      },
      {
        titulo: '5. Reembolsos',
        parrafos: [
          'Si la compra se pagó en línea a través de Wompi, el reembolso se realiza por el mismo medio de pago utilizado. Si la compra se realizó mediante crédito a plazo, el valor del producto devuelto se descuenta del saldo pendiente del crédito.'
        ]
      },
      {
        titulo: '6. Productos excluidos',
        parrafos: [
          'Por razones de higiene y seguridad, no se aceptan cambios ni devoluciones de productos de uso personal que hayan sido abiertos, usados o manipulados después de su entrega, salvo que se trate de una falla de fabricación.'
        ]
      },
      {
        titulo: '7. Exclusiones por mal uso',
        parrafos: [
          'No proceden cambios ni devoluciones cuando el deterioro del producto fue ocasionado por uso inadecuado, manipulación incorrecta, incumplimiento de las recomendaciones de uso o daños posteriores a la entrega.'
        ]
      },
      {
        titulo: '8. Lugar de atención',
        parrafos: [
          'Todas las solicitudes de cambio, devolución o garantía deben gestionarse directamente en las instalaciones de Blendlap, ya que actualmente no se realizan envíos a domicilio.'
        ]
      },
      {
        titulo: '9. Modificaciones',
        parrafos: [
          'Blendlap podrá actualizar esta política cuando sea necesario para mejorar sus procesos internos o adaptarse a cambios normativos.'
        ]
      }
    ]
  }

};
