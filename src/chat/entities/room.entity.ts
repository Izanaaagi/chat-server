import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Message from './message.entity';
import Participant from './participant.entity';

@Entity()
class Room {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  //Group chat or 1:1
  @Column()
  public type: boolean;

  @OneToMany(() => Message, (message: Message) => message.room)
  public messages: Message[];

  @OneToMany(
    () => Participant,
    (participants: Participant) => participants.room,
  )
  public participants: Participant[];
}

export default Room;
