import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import Message from '../../chat/entities/message.entity';
import Participant from '../../chat/entities/participant.entity';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public email: string;

  @Column()
  public name: string;

  @Column({ select: false })
  @Exclude()
  public password: string;

  @OneToMany(() => Message, (message: Message) => message.user)
  public messages: Message[];

  @OneToMany(
    () => Participant,
    (participants: Participant) => participants.user,
  )
  public participants: Participant[];
}

export default User;
