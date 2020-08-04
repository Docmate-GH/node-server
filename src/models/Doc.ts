import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column, OneToMany, DeleteDateColumn } from "typeorm";
import { Page } from "./Page";

@Entity()
export class Doc {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  slug: string
  
  @Column()
  title: string

  @OneToMany(type => Page, page => page.doc, {
    cascade: true
  })
  pages: Page[]

  /** json stringify */
  @Column('text', {
    default: '[]'
  })
  nav: string

  /** json stringify */
  @Column('text', {
    default: '[]'
  })
  sidebar: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @Column('boolean')
  isDeleted: boolean
}