import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Message from '../chat/entities/message.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
class PrivateFile {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @Column()
  @ApiProperty()
  public key: string;

  @JoinColumn()
  @OneToOne(() => Message, (message: Message) => message.privateFile)
  public messageOwner: Message;
}

export default PrivateFile;
