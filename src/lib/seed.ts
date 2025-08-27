
import { db } from './firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

// A simple function to seed initial data if the collection is empty.
// This is useful for development and demonstration purposes.
export async function seedInitialData(collectionName: string, data: any[]) {
    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
            console.log(`Collection '${collectionName}' is empty. Seeding initial data...`);
            const batch = writeBatch(db);
            
            data.forEach((item) => {
                const { id, ...rest } = item;
                 // Convert date strings/objects to Firestore Timestamps
                if (rest.certificate) {
                    rest.certificate.issuedDate = new Date(rest.certificate.issuedDate);
                    rest.certificate.expiryDate = new Date(rest.certificate.expiryDate);
                }
                if (rest.requestDate) {
                    rest.requestDate = new Date(rest.requestDate);
                }

                const docRef = collectionRef; // Let firestore generate ID
                batch.set(doc(collectionRef), rest);
            });
            
            await batch.commit();
            console.log(`Seeding for '${collectionName}' completed.`);
        } else {
             console.log(`Collection '${collectionName}' already contains data. No seeding needed.`);
        }
    } catch (error) {
        console.error(`Error seeding data for ${collectionName}:`, error);
    }
}


// A small helper to re-enable using `doc(collectionRef)` to auto-generate an ID
// while also being able to use `batch.set`.
import { doc } from 'firebase/firestore';
