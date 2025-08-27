
import { AddMemberForm } from '@/components/add-member-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewMemberPage() {
  return (
    <div className="py-8">
       <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
           <h1 className="text-3xl font-bold font-headline">Add New Member</h1>
           <p className="text-muted-foreground">Fill out the form to add a new member to the association.</p>
        </div>
      </div>
      <AddMemberForm />
    </div>
  );
}
