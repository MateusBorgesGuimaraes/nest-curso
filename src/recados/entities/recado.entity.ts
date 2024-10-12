import { Pessoa } from 'src/pessoas/entities/pessoa.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// @Entity("recados") // Caso precise de um nome diferente
@Entity()
export class Recado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  texto: string;

  // Muitos recados podem ser enviados por uma unica pessoa (emissor)
  @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  // Especifica a coluna 'de' que armazena o ID da pessoa que enviou o recado
  @JoinColumn({ name: 'de' })
  de: Pessoa;

  // Muitos recados podem ser enviados para uma unica pessoa (destinatario)
  @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  // Especifica a coluna 'para' que armazena o ID da pessoa que recebe o recado
  @JoinColumn({ name: 'para' })
  para: Pessoa;

  @Column({ default: false }) // Se não passar o type, o default é o tipo do campo
  lido: boolean;

  @Column()
  data: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
