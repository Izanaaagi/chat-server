import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Room from './room.entity';
import User from '../../user/entities/user.entity';

@Entity()
class Participant {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Room, (room: Room) => room.participants)
  public room: Room;
  @ManyToOne(() => User, (user: User) => user.participants)
  public user: User;
}

export default Participant;
