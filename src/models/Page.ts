import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, DeleteDateColumn } from "typeorm";
import { Doc } from "./Doc";

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  slug: string

  @Column()
  index: number

  @Column()
  title: string

  @Column('text')
  content: string

  @ManyToOne(type => Doc, doc => doc.pages)
  doc: Doc

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @Column('boolean')
  isDeleted: boolean
}