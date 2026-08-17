import type { Conversation, Customer } from "@/types/domain";

export const customers: Customer[] = [
  { id: "cus_valentina", name: "Valentina Rojas", phone: "+57 300 482 1198", email: "valentina.rojas@example.com", tags: ["Plan romántico", "Lead caliente"], lastSeen: "Hace 2 min", createdAt: "2026-08-14", notes: "Preguntó por decoración especial y disponibilidad para aniversario." },
  { id: "cus_catalina", name: "Catalina Méndez", phone: "+57 315 706 4210", email: "catalina.mendez@example.com", tags: ["Cliente recurrente"], lastSeen: "Hace 18 min", createdAt: "2026-07-29", notes: "Prefiere atención en la tarde." },
  { id: "cus_andres", name: "Andrés Castillo", phone: "+57 301 442 8831", tags: ["Primera visita"], lastSeen: "Hace 1 h", createdAt: "2026-08-17" },
  { id: "cus_luisa", name: "Luisa Fernanda", phone: "+57 320 194 5732", email: "luisa.fernanda@example.com", tags: ["Reserva confirmada"], lastSeen: "Ayer", createdAt: "2026-08-02" }
];

export const initialConversations: Conversation[] = [
  {
    id: "conv_valentina", customerId: "cus_valentina", channel: "whatsapp", status: "pending", unreadCount: 2, assignedTo: "Atención Harmony", lastMessageAt: "12:36",
    messages: [
      { id: "m1", conversationId: "conv_valentina", content: "Hola, quisiera saber qué planes tienen para celebrar un aniversario.", direction: "incoming", senderType: "customer", senderName: "Valentina Rojas", createdAt: "12:31" },
      { id: "m2", conversationId: "conv_valentina", content: "¡Hola, Valentina! 💚 Tenemos experiencias románticas con jacuzzi, decoración y opciones de bebidas. ¿Para qué fecha estás pensando?", direction: "outgoing", senderType: "bot", senderName: "Harmony IA", createdAt: "12:32", status: "read" },
      { id: "m3", conversationId: "conv_valentina", content: "Para este sábado. Quisiera decoración con pétalos y algo especial. ¿Todavía tienen disponibilidad?", direction: "incoming", senderType: "customer", senderName: "Valentina Rojas", createdAt: "12:36" }
    ]
  },
  {
    id: "conv_catalina", customerId: "cus_catalina", channel: "whatsapp", status: "open", unreadCount: 0, assignedTo: "Harmony IA", lastMessageAt: "12:11",
    messages: [
      { id: "m4", conversationId: "conv_catalina", content: "¿Me puedes recordar qué incluye el plan con jacuzzi?", direction: "incoming", senderType: "customer", senderName: "Catalina Méndez", createdAt: "12:08" },
      { id: "m5", conversationId: "conv_catalina", content: "Claro. Incluye el espacio privado y la experiencia seleccionada. Si quieres, también puedo ayudarte a revisar disponibilidad.", direction: "outgoing", senderType: "bot", senderName: "Harmony IA", createdAt: "12:11", status: "read" }
    ]
  },
  {
    id: "conv_andres", customerId: "cus_andres", channel: "whatsapp", status: "open", unreadCount: 1, lastMessageAt: "11:42",
    messages: [
      { id: "m6", conversationId: "conv_andres", content: "Buenas, ¿atienden hoy en la noche?", direction: "incoming", senderType: "customer", senderName: "Andrés Castillo", createdAt: "11:42" }
    ]
  },
  {
    id: "conv_luisa", customerId: "cus_luisa", channel: "whatsapp", status: "resolved", unreadCount: 0, assignedTo: "Atención Harmony", lastMessageAt: "Ayer",
    messages: [
      { id: "m7", conversationId: "conv_luisa", content: "Perfecto, muchas gracias. Nos vemos mañana.", direction: "incoming", senderType: "customer", senderName: "Luisa Fernanda", createdAt: "Ayer" },
      { id: "m8", conversationId: "conv_luisa", content: "¡Con gusto! Tu reserva quedó confirmada. Te esperamos 💚", direction: "outgoing", senderType: "agent", senderName: "Atención Harmony", createdAt: "Ayer", status: "read" }
    ]
  }
];
