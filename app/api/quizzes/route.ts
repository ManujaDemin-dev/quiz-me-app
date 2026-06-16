import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function GET() {
    try{
        const supabase = await createClient();
        
        const {data: quizzes, error} = await supabase
            .from('quizzes')
            .select("id,title,description,difficulty,room_code,created_at")
            .eq('is_published', true)
            .order('created_at', {ascending: false});

        if (error)  throw error;

        return NextResponse.json(quizzes);
    }catch (error:any) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
}

//post req

export async function POST(request: Request) {
    try{
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
        }

        const {title,description,difficulty} = await request.json();

        if(!title) {
            return NextResponse.json({error: "Title is required."}, {status: 400});
        }

        const {data : newQuiz, error} = await supabase
            .from('quizzes')
            .insert({
                title,
                description,
                difficulty,
                creator_id: user.id,
                is_published: true
            })
            .select()
            .single();
        
        if (error) throw error;

        return NextResponse.json(newQuiz, {status: 201});


    }catch (error:any) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
}

