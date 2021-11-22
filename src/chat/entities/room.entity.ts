import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Message from './message.entity';
import Participant from './participant.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
class Room {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @Column()
  @ApiProperty()
  public name: string;

  // Group chat or 1:1
  @Column()
  @ApiProperty()
  public type: boolean;

  @OneToMany(() => Message, (message: Message) => message.room)
  public messages: Message[];

  @OneToMany(
    () => Participant,
    (participants: Participant) => participants.room,
  )
  @Type(() => Participant)
  public participants: Participant[];
}

export default Room;
