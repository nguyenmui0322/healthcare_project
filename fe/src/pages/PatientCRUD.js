import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Spin, Alert, Button, Modal, Form, Input, Select, Popconfirm, message } from 'antd';
import api from '../api/api';

const { Title } = Typography;
const { Option } = Select;

const genderOptions = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const PatientCRUD = () => {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form] = Form.useForm();

  const fetchPatients = () => {
    setLoading(true);
    api.get('/api/v1/patients/')
      .then(res => {
        setPatients(res.data.results || res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải danh sách bệnh nhân');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPatients();
    api.get('/api/v1/departments/').then(res => {
      setDepartments(res.data.results || res.data);
    });
  }, []);

  const showModal = (patient = null) => {
    setEditingPatient(patient);
    if (patient) {
      form.setFieldsValue({ ...patient, ...patient.user });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingPatient(null);
    form.resetFields();
  };

  const handleFinish = (values) => {
    const data = {
      date_of_birth: values.date_of_birth,
      gender: values.gender,
      address: values.address,
      phone: values.phone,
      department: values.department || null,
    };
    if (editingPatient) {
      api.patch(`/api/v1/patients/${editingPatient.id}/`, data)
        .then(() => {
          message.success('Cập nhật thành công!');
          fetchPatients();
          handleCancel();
        })
        .catch(() => message.error('Cập nhật thất bại!'));
    } else {
      // Thêm mới: cần chọn user (hoặc tạo user mới ở nơi khác)
      if (!values.user) {
        message.error('Bạn cần nhập user id!');
        return;
      }
      api.post('/api/v1/patients/', { ...data, user: values.user })
        .then(() => {
          message.success('Thêm thành công!');
          fetchPatients();
          handleCancel();
        })
        .catch(() => message.error('Thêm thất bại!'));
    }
  };

  const handleDelete = (id) => {
    api.delete(`/api/v1/patients/${id}/`)
      .then(() => {
        message.success('Xóa thành công!');
        fetchPatients();
      })
      .catch(() => message.error('Xóa thất bại!'));
  };

  const columns = [
    { title: 'ID', dataIndex: ['user', 'id'], key: 'id' },
    { title: 'Username', dataIndex: ['user', 'username'], key: 'username' },
    { title: 'First Name', dataIndex: ['user', 'first_name'], key: 'first_name' },
    { title: 'Last Name', dataIndex: ['user', 'last_name'], key: 'last_name' },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Department', dataIndex: ['department'], key: 'department', render: (dep) => dep ? (dep.name || dep) : '' },
    { title: 'Date of Birth', dataIndex: 'date_of_birth', key: 'date_of_birth' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => showModal(record)}>Sửa</Button>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Card style={{ margin: 24 }}>
      <Title level={2}>Quản lý bệnh nhân</Title>
      <Button type="primary" onClick={() => showModal()} style={{ marginBottom: 16 }}>
        Thêm bệnh nhân
      </Button>
      {loading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (
        <Table
          dataSource={patients}
          columns={columns}
          rowKey={record => record.user.id}
          pagination={{ pageSize: 10 }}
        />
      )}
      <Modal
        title={editingPatient ? 'Sửa bệnh nhân' : 'Thêm bệnh nhân'}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingPatient ? 'Cập nhật' : 'Thêm'}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {!editingPatient && (
            <Form.Item name="user" label="User ID" rules={[{ required: true, message: 'Nhập user id!' }]}> 
              <Input placeholder="Nhập user id đã có (hoặc tạo user mới ở nơi khác)" />
            </Form.Item>
          )}
          <Form.Item name="department" label="Khoa">
            <Select allowClear placeholder="Chọn khoa">
              {departments.map(dep => (
                <Option key={dep.id} value={dep.id}>{dep.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date_of_birth" label="Ngày sinh">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select allowClear>
              {genderOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PatientCRUD;
