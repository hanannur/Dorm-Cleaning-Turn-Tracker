export interface User {
  id: number;
  email: string;
  name: string;
  room_id: number | null;
  streak: number;
  last_cleaned: string | null;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  owner_id: number;
  status: 'Clean' | 'Pending' | 'Overdue';
}

export interface RoomData {
  room: Room;
  roommates: Pick<User, 'id' | 'name' | 'streak' | 'last_cleaned'>[];
}
