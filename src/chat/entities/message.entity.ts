import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import User from '../../user/entities/user.entity';
import Room from './room.entity';

@Entity()
class Message {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public message: string;

  @ManyToOne(() => User, (user: User) => user.messages)
  public user: User;
  @ManyToOne(() => Room, (room: Room) => room.messages)
  public room: Room;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updated_at: Date;
}

export default Message;
