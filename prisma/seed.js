import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // Usuarios de muestra (ya insertados previamente)
    const student = await prisma.user.findUnique({ where: { email: 'student@algorithmics.com' } });
    const teacher = await prisma.user.findUnique({ where: { email: 'teacher@algorithmics.com' } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin@algorithmics.com' } });
    if (!student || !teacher || !admin) {
        throw new Error('Usuarios de muestra no encontrados. Ejecuta primero el seed de usuarios.');
    }
    // Módulos
    const module1 = await prisma.module.create({
        data: {
            title: 'Fundamentos de Programación',
            description: 'Aprende los conceptos básicos de la programación',
            createdById: teacher.id,
        },
    });
    const module2 = await prisma.module.create({
        data: {
            title: 'Desarrollo Web',
            description: 'Crea páginas web con HTML, CSS y JavaScript',
            createdById: teacher.id,
        },
    });
    // Clases
    const class1 = await prisma.class.create({
        data: {
            title: 'JavaScript Avanzado',
            description: 'Profundiza en JavaScript moderno',
            schedule: 'Lun, Mié, Vie 15:00-16:30',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: module1.id,
        },
    });
    const class2 = await prisma.class.create({
        data: {
            title: 'Fundamentos de Programación',
            description: 'Clase introductoria a la programación',
            schedule: 'Mar, Jue 10:00-11:30',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: module1.id,
        },
    });
    const class3 = await prisma.class.create({
        data: {
            title: 'Desarrollo Web Frontend',
            description: 'HTML, CSS y JavaScript para la web',
            schedule: 'Sáb 9:00-12:00',
            maxStudents: 25,
            teacherId: teacher.id,
            moduleId: module2.id,
        },
    });
    // Inscribir al estudiante en las clases
    await prisma.studentClass.createMany({
        data: [
            { studentId: student.id, classId: class1.id, status: 'active' },
            { studentId: student.id, classId: class2.id, status: 'active' },
            { studentId: student.id, classId: class3.id, status: 'active' },
        ],
        skipDuplicates: true,
    });
    // Tareas (Assignments)
    await prisma.assignment.createMany({
        data: [
            {
                title: 'Crear una calculadora en JavaScript',
                description: 'Implementa una calculadora básica usando JS',
                dueDate: new Date('2024-12-28'),
                status: 'pending',
                classId: class1.id,
            },
            {
                title: 'Proyecto final - Página web personal',
                description: 'Crea tu propia página web usando HTML, CSS y JS',
                dueDate: new Date('2024-12-30'),
                status: 'pending',
                classId: class3.id,
            },
            {
                title: 'Algoritmo de ordenamiento',
                description: 'Implementa un algoritmo de ordenamiento',
                dueDate: new Date('2024-12-25'),
                status: 'completed',
                classId: class2.id,
            },
        ],
        skipDuplicates: true,
    });
    // Materiales
    await prisma.material.createMany({
        data: [
            {
                title: 'Guía de JavaScript',
                url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide',
                classId: class1.id,
            },
            {
                title: 'Recursos de HTML y CSS',
                url: 'https://developer.mozilla.org/es/docs/Learn',
                classId: class3.id,
            },
        ],
        skipDuplicates: true,
    });
    // Módulos personalizados
    const n8nModule = await prisma.module.create({
        data: {
            title: 'Módulo 1: n8n',
            description: 'Automatización de flujos con n8n.',
            createdById: teacher.id,
        },
    });
    const viteModule = await prisma.module.create({
        data: {
            title: 'Módulo 2: Vite + React',
            description: 'Desarrollo frontend moderno con Vite y React.',
            createdById: teacher.id,
        },
    });
    const openaiModule = await prisma.module.create({
        data: {
            title: 'Módulo 3: OpenAI VAPI',
            description: 'Integración de IA con OpenAI y Voice API.',
            createdById: teacher.id,
        },
    });
    const supabaseModule = await prisma.module.create({
        data: {
            title: 'Módulo 4: Supabase',
            description: 'Backend as a Service y bases de datos en tiempo real.',
            createdById: teacher.id,
        },
    });
    const mcpModule = await prisma.module.create({
        data: {
            title: 'Módulo 5: MCP',
            description: 'Microservicios y Cloud Platforms.',
            createdById: teacher.id,
        },
    });
    // Clases asociadas a cada módulo
    await prisma.class.create({
        data: {
            title: 'Clase n8n',
            description: 'Automatización de procesos con n8n.',
            schedule: 'Lunes 10:00-12:00',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: n8nModule.id,
        },
    });
    await prisma.class.create({
        data: {
            title: 'Clase Vite + React',
            description: 'Desarrollo de apps con Vite y React.',
            schedule: 'Martes 10:00-12:00',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: viteModule.id,
        },
    });
    await prisma.class.create({
        data: {
            title: 'Clase OpenAI VAPI',
            description: 'Integración de IA y voz.',
            schedule: 'Miércoles 10:00-12:00',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: openaiModule.id,
        },
    });
    await prisma.class.create({
        data: {
            title: 'Clase Supabase',
            description: 'Bases de datos y backend en tiempo real.',
            schedule: 'Jueves 10:00-12:00',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: supabaseModule.id,
        },
    });
    await prisma.class.create({
        data: {
            title: 'Clase MCP',
            description: 'Microservicios y cloud platforms.',
            schedule: 'Viernes 10:00-12:00',
            maxStudents: 30,
            teacherId: teacher.id,
            moduleId: mcpModule.id,
        },
    });
    // Crear profesores dummy
    const jeanPaul = await prisma.user.upsert({
        where: { email: 'jeanpaul@algoschool.com' },
        update: {},
        create: {
            email: 'jeanpaul@algoschool.com',
            password: 'algoschool123',
            firstName: 'Jean Paul',
            lastName: 'Raimond',
            role: 'teacher',
        },
    });
    const federico = await prisma.user.upsert({
        where: { email: 'federico@algoschool.com' },
        update: {},
        create: {
            email: 'federico@algoschool.com',
            password: 'algoschool123',
            firstName: 'Federico',
            lastName: 'Peña',
            role: 'teacher',
        },
    });
    const maria = await prisma.user.upsert({
        where: { email: 'maria@algoschool.com' },
        update: {},
        create: {
            email: 'maria@algoschool.com',
            password: 'algoschool123',
            firstName: 'María',
            lastName: 'García',
            role: 'teacher',
        },
    });
    // Crear módulos dummy
    const moduloJeanPaul = await prisma.module.create({
        data: {
            title: 'Automatización con n8n',
            description: 'Flujos de trabajo automáticos con n8n.',
            createdById: jeanPaul.id,
        },
    });
    const moduloFederico = await prisma.module.create({
        data: {
            title: 'React para principiantes',
            description: 'Introducción a React y componentes.',
            createdById: federico.id,
        },
    });
    const moduloMaria = await prisma.module.create({
        data: {
            title: 'Bases de datos con Supabase',
            description: 'Gestión de datos en la nube con Supabase.',
            createdById: maria.id,
        },
    });
    // Crear clases dummy
    const claseJeanPaul = await prisma.class.create({
        data: {
            title: 'Workflows con n8n',
            description: 'Automatiza tareas repetitivas.',
            schedule: 'Lunes 14:00-16:00',
            maxStudents: 20,
            teacherId: jeanPaul.id,
            moduleId: moduloJeanPaul.id,
        },
    });
    const claseFederico = await prisma.class.create({
        data: {
            title: 'Componentes en React',
            description: 'Crea y reutiliza componentes.',
            schedule: 'Miércoles 10:00-12:00',
            maxStudents: 25,
            teacherId: federico.id,
            moduleId: moduloFederico.id,
        },
    });
    const claseMaria = await prisma.class.create({
        data: {
            title: 'Consultas SQL básicas',
            description: 'Aprende a consultar datos en Supabase.',
            schedule: 'Viernes 09:00-11:00',
            maxStudents: 15,
            teacherId: maria.id,
            moduleId: moduloMaria.id,
        },
    });
    // Crear tareas dummy
    await prisma.assignment.createMany({
        data: [
            {
                title: 'Automatiza un flujo simple',
                description: 'Crea un flujo en n8n que envíe un email.',
                dueDate: new Date('2024-12-10'),
                status: 'pending',
                classId: claseJeanPaul.id,
            },
            {
                title: 'Crea un componente funcional',
                description: 'Haz un botón personalizado en React.',
                dueDate: new Date('2024-12-12'),
                status: 'pending',
                classId: claseFederico.id,
            },
            {
                title: 'Consulta datos de una tabla',
                description: 'Haz una consulta SELECT en Supabase.',
                dueDate: new Date('2024-12-15'),
                status: 'pending',
                classId: claseMaria.id,
            },
        ],
        skipDuplicates: true,
    });
    // Crear materiales dummy
    await prisma.material.createMany({
        data: [
            {
                title: 'Documentación oficial n8n',
                url: 'https://docs.n8n.io/',
                classId: claseJeanPaul.id,
            },
            {
                title: 'Tutorial de React',
                url: 'https://react.dev/learn',
                classId: claseFederico.id,
            },
            {
                title: 'Guía de Supabase',
                url: 'https://supabase.com/docs',
                classId: claseMaria.id,
            },
        ],
        skipDuplicates: true,
    });
    // Inscribir al estudiante de ejemplo en las nuevas clases dummy
    await prisma.studentClass.createMany({
        data: [
            { studentId: student.id, classId: claseJeanPaul.id, status: 'active' },
            { studentId: student.id, classId: claseFederico.id, status: 'active' },
            { studentId: student.id, classId: claseMaria.id, status: 'active' },
        ],
        skipDuplicates: true,
    });
    console.log('Seed de datos de ejemplo completado.');
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => prisma.$disconnect());
