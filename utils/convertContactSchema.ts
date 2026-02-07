// import { ContactSchema } from "@/types";
// import * as z from "zod";

// export function contactSchemaToZod(schema: ContactSchema) {
//   const shape: Record<string, any> = {};

//   for (const field of schema.fields) {
//     let zType: z.ZodTypeAny = z.string().optional();

//     switch (field.type) {
//       case "text":
//         zType = z.string().optional();
//         break;

//       case "email":
//         zType = z.string().optional();
//         break;

//       case "phoneNumber":
//         zType = z.string().optional();
//         break;

//       case "number":
//         zType = z.union([z.number(), z.string()]).optional();
//         break;

//       case "date":
//         zType = z.string().optional();
//         break;

//       case "select":
//         if (field.options?.length) {
//           zType = z.enum(field.options as [string, ...string[]]).optional();
//         } else {
//           zType = z.string().optional();
//         }
//         break;
//     }

//     if (field.isrequired) {
//       zType = zType.refine(
//         (val) => val !== undefined && val !== null && val !== "",
//         `Le champ ${field.name} est requis`,
//       );
//     }

//     shape[field.id] = zType.describe(field.name);
//   }

//   return z.object(shape);
// }

// export function contactSchemaToJson(schema: ContactSchema) {
//   const zodContactSchema = contactSchemaToZod(schema);
//   // 2. Créer un schéma pour un TABLEAU de contacts
//   const zodArraySchema = z.array(zodContactSchema); 
  
//   // 3. Retourner le JSON Schema pour le tableau
//   return z.toJSONSchema(zodArraySchema);
// }
